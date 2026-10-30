(function () {
  "use strict";

  // Booking form: builds a WhatsApp message with the guest's dates.
  var form = document.getElementById("reserva-form");
  if (form) {
    var inEl = form.elements.checkin;
    var outEl = form.elements.checkout;
    var err = form.querySelector(".form-error");
    var today = new Date();
    var iso = function (d) {
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    };
    var br = function (v) {
      var p = v.split("-");
      return p[2] + "/" + p[1] + "/" + p[0];
    };
    inEl.min = iso(today);
    outEl.min = iso(new Date(today.getTime() + 86400000));
    inEl.addEventListener("change", function () {
      if (!inEl.value) return;
      var next = new Date(inEl.value + "T12:00:00");
      next.setDate(next.getDate() + 1);
      outEl.min = iso(next);
      if (!outEl.value || outEl.value <= inEl.value) outEl.value = iso(next);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      err.textContent = "";
      if (!inEl.value || !outEl.value) {
        err.textContent = "Informe as datas de entrada e saída.";
        return;
      }
      if (outEl.value <= inEl.value) {
        err.textContent = "A data de saída precisa ser depois da entrada.";
        return;
      }
      var f = form.elements;
      var msg = "Olá! Gostaria de consultar disponibilidade no Hotel Bougainville.\n" +
        "Entrada: " + br(inEl.value) + "\n" +
        "Saída: " + br(outEl.value) + "\n" +
        "Hóspedes: " + f.hospedes.value + "\n" +
        "Acomodação: " + f.quarto.value +
        (f.nome.value.trim() ? "\nNome: " + f.nome.value.trim() : "");
      window.open("https://wa.me/" + form.dataset.whatsapp + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    });
  }

  // Gallery lightbox using the native <dialog>.
  var box = document.getElementById("lightbox");
  if (box && typeof box.showModal === "function") {
    var img = box.querySelector("img");
    var cap = box.querySelector("p");
    document.querySelectorAll("[data-lightbox]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        img.src = a.getAttribute("href");
        img.alt = a.dataset.caption;
        cap.textContent = a.dataset.caption;
        box.showModal();
      });
    });
    box.querySelector("button").addEventListener("click", function () { box.close(); });
    box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
  }
})();
