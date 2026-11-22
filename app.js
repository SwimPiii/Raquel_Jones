(function () {
  "use strict";

  const config = window.CUMPLE_RAQUEL_CONFIG;
  const STORAGE_KEY = "raquel-cumple-2026-progress-v3";
  const TEST_MODE = new URLSearchParams(window.location.search).get("modo") === "pruebas";
  const ADVANCE_TEST_KEY = "PRUEBAISMAEL";
  const TOTAL_STAGES = 10;
  const INTRO_STORY = "En 2026, entre diarios de expedición y mapas sin firma, empezó a circular un nombre: Raquel Jones, exploradora incansable y descifradora de enigmas. Una tarde recibió un sobre sellado. Dentro había un mapa incompleto y una nota: «El tesoro no se encuentra siguiendo una línea recta. Cada respuesta te dará una nueva pista; algunas están muy cerca y otras esperan su momento». Hoy comienza la búsqueda.";
  const COUNT_ERROR_MESSAGES = ["Vas a tener que volver a la escuela.", "Aprende a contar."];
  const FRACTIONS = [
    "3/2 + 5/3 + 7/4 - 11/12",
    "7/3 + 5/4 - 11/6 - 7/4",
    "9/4 + 5/3 - 11/12",
    "13/2 + 7/3 - 5/6",
    "7/2 - 5/3 - 5/6",
    "13/4 + 5/3 - 23/12",
    "11/2 + 4/3 - 11/6",
    "21/4 + 7/3 - 7/12",
    "11/4 + 2/3 - 5/12",
    "7/2 + 5/3 - 19/6",
    "13/4 - 7/3 - 11/12",
    "17/3 + 7/4 - 17/12",
    "11/2 + 5/3 - 25/6",
    "7/2 + 5/3 - 31/6",
    "7/2 + 5/3 - 7/6"
  ];

  const elements = {
    connect: document.getElementById("connect-button"),
    noticeConnect: document.getElementById("notice-connect"),
    demo: document.getElementById("demo-button"),
    notice: document.getElementById("connection-notice"),
    save: document.getElementById("save-button"),
    status: document.getElementById("sync-label"),
    statusWrap: document.getElementById("sync-status"),
    loading: document.getElementById("loading-state"),
    stageView: document.getElementById("stage-view"),
    birthdayCountdownTime: document.getElementById("birthday-countdown-time"),
    testBanner: document.getElementById("test-banner"),
    progressLabel: document.getElementById("progress-label"),
    progressCount: document.getElementById("progress-count"),
    progressBar: document.getElementById("progress-bar"),
    progressSteps: document.getElementById("progress-steps"),
    tools: document.getElementById("game-tools"),
    storageHint: document.getElementById("storage-hint"),
    reset: document.getElementById("reset-button"),
    toast: document.getElementById("toast")
  };

  let state = freshState();
  let storageMode = null;
  let testModeUnlocked = false;
  let dirty = false;
  let toastTimer = null;
  let clockTimer = null;
  let lastSuccess = "";

  function freshState() {
    return { version: 3, stage: 0, introCompleted: false, updatedAt: null };
  }

  function normalizeState(value) {
    if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== 3) return freshState();
    const stage = Number.isInteger(value.stage) ? Math.min(TOTAL_STAGES, Math.max(0, value.stage)) : 0;
    return {
      version: 3,
      stage,
      introCompleted: value.introCompleted === true,
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null
    };
  }

  function serializeState() {
    return { ...state, updatedAt: new Date().toISOString() };
  }

  function showToast(message, isError) {
    elements.toast.textContent = message;
    elements.toast.classList.toggle("toast-error", Boolean(isError));
    elements.toast.classList.add("toast-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("toast-visible"), 4500);
  }

  function setStatus(message, isConnected) {
    elements.status.textContent = message;
    elements.statusWrap.classList.toggle("is-connected", Boolean(isConnected));
  }

  function isTestMode() {
    return TEST_MODE || testModeUnlocked;
  }

  function beforeLaunch() {
    return !isTestMode() && Date.now() < new Date(config.startAt).getTime();
  }

  function secondDayLocked() {
    return !isTestMode() && state.stage === 5 && Date.now() < new Date(config.secondDayUnlockAt).getTime();
  }

  function updateBirthdayCountdown() {
    const remainingMinutes = Math.floor(Math.max(0, new Date(config.birthdayAt).getTime() - Date.now()) / 60000);
    const days = Math.floor(remainingMinutes / 1440);
    const hours = Math.floor((remainingMinutes % 1440) / 60);
    const minutes = remainingMinutes % 60;
    const dayLabel = days === 1 ? "día" : "días";
    const hourLabel = hours === 1 ? "hora" : "horas";
    const minuteLabel = minutes === 1 ? "minuto" : "minutos";
    elements.birthdayCountdownTime.textContent = `${days} ${dayLabel}, ${hours} ${hourLabel} y ${minutes} ${minuteLabel}`;
  }

  function countdown(target) {
    const remaining = Math.max(0, target - Date.now());
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return { days, hours, minutes, seconds };
  }

  function countdownMarkup(target, title, description, allowAdvance) {
    const time = countdown(target);
    const card = document.createElement("div");
    card.className = "countdown-content";
    card.dataset.countdownTarget = String(target);
    const icon = document.createElement("div");
    icon.className = "countdown-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "✦";
    const heading = document.createElement("p");
    heading.className = "eyebrow";
    heading.textContent = title;
    const text = document.createElement("h2");
    text.textContent = description;
    const timer = document.createElement("div");
    timer.className = "countdown-timer";
    [["DÍAS", time.days], ["HORAS", time.hours], ["MIN", time.minutes], ["SEG", time.seconds]].forEach(([label, amount]) => {
      const part = document.createElement("div");
      part.className = "countdown-part";
      const value = document.createElement("strong");
      value.textContent = String(amount).padStart(2, "0");
      const caption = document.createElement("span");
      caption.textContent = label;
      part.append(value, caption);
      timer.append(part);
    });
    card.append(icon, heading, text, timer);
    if (allowAdvance) addAdvanceControl(card);
    return card;
  }

  function addAdvanceControl(parent) {
    const container = document.createElement("div");
    container.className = "advance-control";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "button button-outline";
    toggle.textContent = "Adelantar pruebas";

    const form = document.createElement("form");
    form.className = "advance-form";
    form.hidden = true;
    const label = document.createElement("label");
    label.className = "field-label";
    label.htmlFor = "advance-password";
    label.textContent = "Palabra clave";
    const input = document.createElement("input");
    input.id = "advance-password";
    input.className = "answer-input";
    input.type = "password";
    input.autocomplete = "off";
    input.required = true;
    const feedback = document.createElement("p");
    feedback.className = "answer-feedback";
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "button button-primary submit-button";
    submit.textContent = "Comprobar clave";

    toggle.addEventListener("click", () => {
      form.hidden = !form.hidden;
      if (!form.hidden) input.focus();
    });
    input.addEventListener("input", () => {
      input.removeAttribute("aria-invalid");
      feedback.textContent = "";
    });
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (input.value.trim() !== ADVANCE_TEST_KEY) {
        input.setAttribute("aria-invalid", "true");
        feedback.textContent = "La palabra clave no es correcta.";
        return;
      }
      testModeUnlocked = true;
      render();
      showToast("Modo de pruebas activado.", false);
    });

    form.append(label, input, feedback, submit);
    container.append(toggle, form);
    parent.append(container);
  }

  function updateCountdownTimer(card, target) {
    const time = countdown(target);
    [time.days, time.hours, time.minutes, time.seconds].forEach((amount, index) => {
      const value = card.querySelectorAll(".countdown-part strong")[index];
      if (value) value.textContent = String(amount).padStart(2, "0");
    });
  }

  function updateProgress() {
    const completed = Math.min(state.stage, TOTAL_STAGES);
    elements.progressCount.textContent = `${completed} / ${TOTAL_STAGES}`;
    elements.progressBar.style.width = `${(completed / TOTAL_STAGES) * 100}%`;
    elements.progressLabel.textContent = completed === 0 ? "Aún por empezar" : completed === TOTAL_STAGES ? "Aventura completada" : `Prueba ${completed} superada`;
    elements.progressSteps.replaceChildren();
    for (let index = 0; index < TOTAL_STAGES; index++) {
      const step = document.createElement("span");
      step.className = index < completed ? "progress-step is-done" : "progress-step";
      elements.progressSteps.append(step);
    }
  }

  function addText(parent, tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
  }

  function renderMessage(parent) {
    if (!lastSuccess) return;
    const message = document.createElement("p");
    message.className = "success-message";
    message.setAttribute("role", "status");
    message.textContent = lastSuccess;
    parent.append(message);
    lastSuccess = "";
  }

  function renderFormStage(options) {
    const card = document.createElement("div");
    card.className = "stage-content";
    if (options.eyebrow) addText(card, "p", "eyebrow", options.eyebrow);
    if (options.title) addText(card, "h2", "stage-title", options.title);
    if (options.description) addText(card, "p", "stage-description", options.description);
    if (options.extra) addText(card, "p", "stage-extra", options.extra);
    renderMessage(card);

    const form = document.createElement("form");
    form.className = "answer-form";
    const label = document.createElement("label");
    label.className = options.hideLabel ? "sr-only" : "field-label";
    label.htmlFor = "answer-input";
    label.textContent = options.label;
    const input = document.createElement("input");
    input.className = "answer-input";
    input.id = "answer-input";
    input.name = "answer";
    input.type = options.type || "text";
    input.inputMode = options.inputMode || "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = options.placeholder || "";
    input.maxLength = options.maxLength || 80;
    if (options.type === "number") {
      input.min = "0";
      input.step = "1";
    }
    const feedback = document.createElement("p");
    feedback.className = "answer-feedback";
    feedback.setAttribute("aria-live", "assertive");
    const submit = document.createElement("button");
    submit.className = "button button-primary submit-button";
    submit.type = "submit";
    submit.textContent = options.buttonText || "Comprobar respuesta";
    form.append(label, input, feedback, submit);
    form.addEventListener("submit", event => {
      event.preventDefault();
      options.check(input.value, feedback, input);
    });
    card.append(form);
    elements.stageView.replaceChildren(card);
  }

  function renderIntro() {
    const card = document.createElement("div");
    card.className = "stage-content intro-content";
    addText(card, "p", "eyebrow", "PRÓLOGO");
    addText(card, "h2", "stage-title", "RaquelJones");
    addText(card, "p", "intro-story", INTRO_STORY);
    const button = document.createElement("button");
    button.className = "button button-primary intro-button";
    button.type = "button";
    button.textContent = "Comenzar aventura";
    button.addEventListener("click", () => {
      state.introCompleted = true;
      dirty = true;
      persistLocal();
      render();
    });
    card.append(button);
    elements.stageView.replaceChildren(card);
  }

  function renderHeartsStage() {
    const card = document.createElement("div");
    card.className = "stage-content hearts-content";
    addText(card, "h2", "stage-title", "4 Corazones escondidos");
    const button = document.createElement("button");
    button.className = "button button-primary submit-button";
    button.type = "button";
    button.textContent = "Continuar";
    button.addEventListener("click", () => {
      if (window.confirm("¿Has comprobado que Raquel resolvió las cuatro adivinanzas?")) {
        advance("¡Las cuatro adivinanzas están resueltas!");
      }
    });
    card.append(button);
    elements.stageView.replaceChildren(card);
  }

  function advance(message) {
    state.stage = Math.min(TOTAL_STAGES, state.stage + 1);
    lastSuccess = message === null ? "" : message || "¡Correcto! Una pista más queda resuelta.";
    dirty = true;
    updateProgress();
    persistLocal();
    render();
  }

  function answerResult(feedback, input, isCorrect, message) {
    feedback.textContent = message;
    feedback.classList.toggle("feedback-success", isCorrect);
    if (isCorrect) {
      input.disabled = true;
      input.setAttribute("aria-invalid", "false");
    } else {
      input.setAttribute("aria-invalid", "true");
      input.focus();
      input.select();
    }
  }

  function normalized(value) {
    return String(value).trim().toLocaleUpperCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
  }

  function renderCoordinates() {
    const card = document.createElement("div");
    card.className = "stage-content";
    addText(card, "p", "eyebrow", "PRUEBA 7 · LAS COORDENADAS");
    addText(card, "h2", "stage-title", "El mapa de fracciones");
    addText(card, "p", "stage-description", "Resuelve las operaciones y rellena el formato con las coordenadas.");

    const equations = document.createElement("ol");
    equations.className = "equation-list";
    FRACTIONS.forEach((equation, index) => {
      const row = document.createElement("li");
      row.className = "equation-row";
      addText(row, "span", "equation-label", `Operación ${index + 1}`);
      addText(row, "strong", "equation", `${equation} = ?`);
      equations.append(row);
    });
    card.append(equations);

    const hint = document.createElement("p");
    hint.className = "coordinate-hint";
    hint.innerHTML = "Formato a rellenar: <strong>_ _ . _ _ _ _ _ _, - _ . _ _ _ _ _ _</strong>";
    card.append(hint);

    renderMessage(card);
    const form = document.createElement("form");
    form.className = "answer-form";
    const label = document.createElement("label");
    label.className = "field-label";
    label.htmlFor = "coordinate-input";
    label.textContent = "Escribe las coordenadas completas";
    const input = document.createElement("input");
    input.className = "answer-input coordinate-input";
    input.id = "coordinate-input";
    input.name = "coordinates";
    input.type = "text";
    input.inputMode = "decimal";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = "";
    input.maxLength = 40;
    const feedback = document.createElement("p");
    feedback.className = "answer-feedback";
    feedback.setAttribute("aria-live", "assertive");
    const submit = document.createElement("button");
    submit.className = "button button-primary submit-button";
    submit.type = "submit";
    submit.textContent = "Comprobar coordenadas";
    form.append(label, input, feedback, submit);
    form.addEventListener("submit", event => {
      event.preventDefault();
      const value = input.value.replace(/\s+/g, "");
      const expected = config.answers.coordinates.replace(/\s+/g, "");
      const correct = value === expected;
      answerResult(feedback, input, correct, correct ? "Correcto." : "Aún hay algún dígito cambiado.");
      if (correct) {
        state.stage = 7;
        dirty = true;
        lastSuccess = "";
        persistLocal();
        render();
      }
    });
    card.append(form);
    elements.stageView.replaceChildren(card);
  }

  function renderComplete() {
    const card = document.createElement("div");
    card.className = "stage-content completion-content";
    addText(card, "h2", "stage-title", "Tu regalito merecido te espera junto los cascos de la moto");
    elements.stageView.replaceChildren(card);
  }

  function renderNextCode() {
    const card = document.createElement("div");
    card.className = "stage-content";
    addText(card, "h2", "stage-title", "Ale, ya sabes dónde tienes que ir.");
    const mapLink = document.createElement("a");
    mapLink.className = "button button-outline map-button";
    mapLink.href = `https://www.google.com/maps?q=${encodeURIComponent(config.answers.coordinates)}`;
    mapLink.target = "_blank";
    mapLink.rel = "noopener noreferrer";
    mapLink.textContent = "Abrir mapa GPS";
    card.append(mapLink);
    renderMessage(card);

    const form = document.createElement("form");
    form.className = "answer-form";
    const label = document.createElement("label");
    label.className = "sr-only";
    label.htmlFor = "answer-input";
    label.textContent = "Código siguiente";
    const input = document.createElement("input");
    input.className = "answer-input";
    input.id = "answer-input";
    input.name = "answer";
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.maxLength = 80;
    const feedback = document.createElement("p");
    feedback.className = "answer-feedback";
    feedback.setAttribute("aria-live", "assertive");
    const submit = document.createElement("button");
    submit.className = "button button-primary submit-button";
    submit.type = "submit";
    submit.textContent = "Comprobar respuesta";
    form.append(label, input, feedback, submit);
    form.addEventListener("submit", event => {
      event.preventDefault();
      const correct = normalized(input.value) === normalized(config.answers.afterCoordinatesCode);
      answerResult(feedback, input, correct, correct ? "Código aceptado." : "Código incorrecto.");
      if (correct) advance("Código correcto.");
    });
    card.append(form);
    elements.stageView.replaceChildren(card);
  }

  function stageError(message, feedback) {
    feedback.textContent = message;
    feedback.classList.remove("feedback-success");
  }

  function render() {
    const waitingForLaunch = beforeLaunch();
    updateBirthdayCountdown();
    document.body.classList.toggle("launch-countdown-only", waitingForLaunch);
    updateProgress();
    elements.loading.hidden = true;
    elements.stageView.hidden = false;
    elements.testBanner.hidden = !isTestMode();
    elements.notice.hidden = Boolean(storageMode);
    elements.tools.hidden = !storageMode;
    elements.save.disabled = storageMode !== "drive" || !dirty;
    elements.connect.textContent = storageMode === "drive" ? "Drive conectado" : "Conectar Drive";
    elements.connect.disabled = storageMode === "drive";
    elements.storageHint.textContent = storageMode === "local"
      ? "Se guarda automáticamente en este dispositivo."
      : "Cambios en Drive pendientes de guardar.";

    if (waitingForLaunch) {
      elements.stageView.replaceChildren(countdownMarkup(new Date(config.startAt).getTime(), "INICIO · 25 DE NOVIEMBRE A LAS 15:30 (HORA PENINSULAR)", "La primera pista se desbloquea en…", true));
      return;
    }
    if (!storageMode) {
      const card = document.createElement("div");
      card.className = "stage-content welcome-content";
      addText(card, "p", "eyebrow", "TODO LISTO");
      addText(card, "h2", "stage-title", "¿Preparada para empezar?");
      addText(card, "p", "stage-description", "Elige dónde guardar el progreso. Podrás continuar más tarde y en cada respuesta se abrirá la siguiente pista.");
      elements.stageView.replaceChildren(card);
      return;
    }
    if (!state.introCompleted) {
      renderIntro();
      return;
    }
    if (secondDayLocked()) {
      elements.stageView.replaceChildren(countdownMarkup(new Date(config.secondDayUnlockAt).getTime(), "DÍA 2 · 26 DE NOVIEMBRE A LAS 00:00 (HORA PENINSULAR)", "Tienes que esperar para hacer las 5 pruebas siguientes…", true));
      return;
    }
    if (state.stage >= TOTAL_STAGES) {
      renderComplete();
      return;
    }

    switch (state.stage) {
      case 0:
        renderFormStage({
          eyebrow: "PRUEBA 1 · OJO Y PACIENCIA",
          title: "Ni uno más, ni uno menos",
          description: "Cuenta todos los garbanzos del cuenco y escribe el número exacto.",
          label: "¿Cuántos garbanzos hay?",
          type: "number",
          inputMode: "numeric",
          placeholder: "Escribe el número",
          maxLength: 8,
          check: (value, feedback, input) => {
            const correct = value.trim() === String(config.chickpeaCount);
            const wrongMessage = COUNT_ERROR_MESSAGES[Math.floor(Math.random() * COUNT_ERROR_MESSAGES.length)];
            answerResult(feedback, input, correct, correct ? "¡Correcto!" : wrongMessage);
            if (correct) advance("¡Correcto!");
          }
        });
        break;
      case 1:
        renderFormStage({
          title: "Palabra de 5 letras",
          label: "Respuesta",
          hideLabel: true,
          maxLength: 20,
          check: (value, feedback, input) => {
            const normalizedValue = normalized(value);
            if (normalizedValue === normalized(config.word)) {
              answerResult(feedback, input, true, "¡Esa es!");
              advance("¡Correcto! Siguiente pista: Busca en tus orígenes.");
            } else if (normalizedValue.length === 5) {
              answerResult(feedback, input, false, "Sí, tiene 5 letras, pero esa no es.");
            } else {
              answerResult(feedback, input, false, "Tiene que ser una palabra de 5 letras.");
            }
          }
        });
        break;
      case 2:
        renderFormStage({
          title: "¿Qué no debería haber allí?",
          label: "Respuesta",
          hideLabel: true,
          maxLength: 12,
          check: (value, feedback, input) => {
            const correct = value.trim() === config.answers.originCode;
            answerResult(feedback, input, correct, correct ? "Respuesta correcta." : "Respuesta incorrecta.");
            if (correct) advance(null);
          }
        });
        break;
      case 3:
        renderFormStage({
          title: "Tu móvil sabe cosas que ocurrirán y tú eres tan ceporris que no sabes ni cuándo.",
          label: "Respuesta",
          hideLabel: true,
          inputMode: "numeric",
          maxLength: 12,
          check: (value, feedback, input) => {
            const correct = value.trim() === config.answers.calendarCode;
            answerResult(feedback, input, correct, correct ? "¡Respuesta correcta!" : "Respuesta incorrecta.");
            if (correct) advance("¡Bien! Ahora pregunta a María por la sorpresa que tiene para ti.");
          }
        });
        break;
      case 4:
        renderFormStage({
          eyebrow: "PRUEBA 5 · PACIENCIA",
          title: "Una sorpresa de mil piezas",
          description: "Pregunta a María, pídele tu siguiente sorpresita....jijijijijiji",
          label: "Código que te dé María",
          inputMode: "numeric",
          placeholder: "Código secreto",
          maxLength: 20,
          check: (value, feedback, input) => {
            const correct = value.trim() === config.answers.mariaCode;
            answerResult(feedback, input, correct, correct ? "¡Puzzle resuelto y código aceptado!" : "El código no coincide. Comprueba que el puzzle esté terminado y pregunta a María.");
            if (correct) advance(null);
          }
        });
        break;
      case 5:
        renderHeartsStage();
        break;
      case 6:
        renderCoordinates();
        break;
      case 7:
        renderNextCode();
        break;
      case 8:
        renderFormStage({
          eyebrow: "PRUEBA 9 · MARIO KART",
          title: "Tres carreras seguidas",
          description: "Gana a María 3 carreras seguidas al Mario Kart de Nintendo Switch. En la última no podéis usar objetos ninguna de las dos.",
          extra: "Puedes rendirte y decir: «Soy una paquete al Mario Kart y no puedo ganar a María». Si lo haces, María te da el código.",
          label: "Código de María",
          inputMode: "numeric",
          placeholder: "Código",
          maxLength: 20,
          check: (value, feedback, input) => {
            const correct = value.trim() === config.answers.marioKartCode;
            answerResult(feedback, input, correct, correct ? "Código aceptado." : "Código incorrecto.");
            if (correct) advance("Código correcto.");
          }
        });
        break;
      case 9:
        renderFormStage({
          eyebrow: "PRUEBA 10 · LA CENA",
          title: "Bueno, solo queda que nos hagas una cena rica rica y entonces nosotros, que somos el jurado, te podremos dar la pista final.",
          label: "Respuesta",
          hideLabel: true,
          maxLength: 30,
          check: (value, feedback, input) => {
            const correct = normalized(value) === normalized(config.answers.dinnerCode);
            answerResult(feedback, input, correct, correct ? "¡Correcto!" : "Respuesta incorrecta.");
            if (correct) {
              state.stage = TOTAL_STAGES;
              dirty = true;
              lastSuccess = "";
              persistLocal();
              render();
            }
          }
        });
        break;
      default:
        renderComplete();
    }
  }

  function persistLocal() {
    if (storageMode !== "local") return;
    try {
      const data = serializeState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      state.updatedAt = data.updatedAt;
      dirty = false;
      setStatus("Guardado en este móvil", true);
      elements.save.disabled = true;
    } catch (error) {
      setStatus("No se pudo guardar en este móvil", false);
      showToast(`Error al guardar localmente: ${error.message}`, true);
    }
  }

  function enterLocalMode() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      state = saved ? normalizeState(JSON.parse(saved)) : freshState();
      storageMode = "local";
      dirty = false;
      setStatus("Guardado en este móvil", true);
      render();
    } catch (error) {
      showToast(`No se pudo leer el progreso local: ${error.message}`, true);
    }
  }

  async function connectDrive() {
    elements.connect.disabled = true;
    elements.noticeConnect.disabled = true;
    setStatus("Conectando con Drive…", false);
    try {
      const data = await window.comidasDrive.signIn();
      state = normalizeState(data);
      storageMode = "drive";
      dirty = false;
      setStatus("Drive conectado", true);
      render();
    } catch (error) {
      setStatus("No se pudo conectar con Drive", false);
      showToast(error.message || "No se pudo conectar con Google Drive.", true);
    } finally {
      elements.connect.disabled = storageMode === "drive";
      elements.noticeConnect.disabled = false;
    }
  }

  async function saveToDrive() {
    elements.save.disabled = true;
    setStatus("Guardando en Drive…", false);
    try {
      const data = serializeState();
      await window.comidasDrive.save(data);
      state.updatedAt = data.updatedAt;
      dirty = false;
      setStatus("Guardado en Drive", true);
      showToast("Progreso guardado en Google Drive.", false);
      render();
    } catch (error) {
      elements.save.disabled = false;
      setStatus("Error al guardar en Drive", false);
      showToast(error.message || "No se pudo guardar en Google Drive.", true);
    }
  }

  function resetProgress() {
    if (!window.confirm("¿Seguro que quieres reiniciar todas las pruebas? Esta acción no se puede deshacer.")) return;
    state = freshState();
    lastSuccess = "";
    dirty = true;
    if (storageMode === "local") persistLocal();
    render();
    showToast(storageMode === "local" ? "Progreso reiniciado en este móvil." : "Progreso reiniciado. Guarda en Drive para confirmar el cambio.", false);
  }

  function tick() {
    updateBirthdayCountdown();
    const waitingForLaunch = beforeLaunch();
    const waitingForSecondDay = secondDayLocked();
    const countdownCard = elements.stageView.querySelector(".countdown-content");
    if (waitingForLaunch || waitingForSecondDay) {
      const target = new Date(waitingForLaunch ? config.startAt : config.secondDayUnlockAt).getTime();
      if (!countdownCard || Number(countdownCard.dataset.countdownTarget) !== target) {
        render();
      } else {
        updateCountdownTimer(countdownCard, target);
      }
      return;
    }
    if (countdownCard) render();
  }

  elements.demo.addEventListener("click", enterLocalMode);
  elements.connect.addEventListener("click", connectDrive);
  elements.noticeConnect.addEventListener("click", connectDrive);
  elements.save.addEventListener("click", saveToDrive);
  elements.reset.addEventListener("click", resetProgress);
  window.addEventListener("beforeunload", event => {
    if (storageMode === "drive" && dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  });

  updateProgress();
  render();
  clockTimer = window.setInterval(tick, 1000);
  window.addEventListener("pagehide", () => window.clearInterval(clockTimer), { once: true });
})();
