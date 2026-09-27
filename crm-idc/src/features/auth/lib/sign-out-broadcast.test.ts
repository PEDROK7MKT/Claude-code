import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** BroadcastChannel falso: entrega a todos os objetos com o mesmo nome, menos ao que enviou. */
class FakeBroadcastChannel extends EventTarget {
  static instances: FakeBroadcastChannel[] = [];
  readonly name: string;

  constructor(name: string) {
    super();
    this.name = name;
    FakeBroadcastChannel.instances.push(this);
  }

  postMessage(data: unknown): void {
    for (const other of FakeBroadcastChannel.instances) {
      if (other !== this && other.name === this.name) other.dispatchEvent(new MessageEvent("message", { data }));
    }
  }

  close(): void {
    FakeBroadcastChannel.instances = FakeBroadcastChannel.instances.filter((c) => c !== this);
  }
}

/** Módulo novo a cada teste (o canal é um singleton por aba). */
async function loadModule() {
  vi.resetModules();
  return import("./sign-out-broadcast");
}

beforeEach(() => {
  FakeBroadcastChannel.instances = [];
  vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("broadcastSignOut / subscribeToSignOut", () => {
  it("avisa as outras abas do logout", async () => {
    const { AUTH_CHANNEL_NAME, SIGN_OUT_MESSAGE, broadcastSignOut } = await loadModule();
    const otherTab = new FakeBroadcastChannel(AUTH_CHANNEL_NAME);
    const received = vi.fn();
    otherTab.addEventListener("message", (event) => received((event as MessageEvent).data));

    broadcastSignOut();

    expect(received).toHaveBeenCalledWith(SIGN_OUT_MESSAGE);
  });

  it("a aba reage ao logout de outra aba, e não ao próprio aviso", async () => {
    const { AUTH_CHANNEL_NAME, SIGN_OUT_MESSAGE, broadcastSignOut, subscribeToSignOut } = await loadModule();
    const onSignOut = vi.fn();
    const unsubscribe = subscribeToSignOut(onSignOut);

    broadcastSignOut(); // esta aba saiu: ela mesma já cuida da limpeza
    expect(onSignOut).not.toHaveBeenCalled();

    const otherTab = new FakeBroadcastChannel(AUTH_CHANNEL_NAME);
    otherTab.postMessage("outra-coisa");
    expect(onSignOut).not.toHaveBeenCalled();

    otherTab.postMessage(SIGN_OUT_MESSAGE);
    expect(onSignOut).toHaveBeenCalledTimes(1);

    unsubscribe();
    otherTab.postMessage(SIGN_OUT_MESSAGE);
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("sem BroadcastChannel no navegador, não quebra", async () => {
    vi.stubGlobal("BroadcastChannel", undefined);
    const { broadcastSignOut, subscribeToSignOut } = await loadModule();
    expect(() => broadcastSignOut()).not.toThrow();
    const unsubscribe = subscribeToSignOut(vi.fn());
    expect(() => unsubscribe()).not.toThrow();
  });
});
