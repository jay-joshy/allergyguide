import { getDomainAnswers, traverseTree, D1_DT, D2_P1_DT, D2_P2_DT, DomainRisk, Answer } from "./rob_2_decision_trees.js";
import { getAnswer, setup_save_state } from "./rob_2_utils.js"

// SAVE STATE IN LOCAL STORAGE
setup_save_state()

// Function to process and update the decision tree outcome
const process_dt1 = () => {
  const userAnswers = getDomainAnswers(1, 3);
  const outcome = traverseTree(D1_DT, userAnswers);
  if (outcome != "null") { document.getElementById("domain-1-judgement").innerHTML = outcome; }
  else {
    document.getElementById("domain-1-judgement").innerHTML = "Fill out questions.";
  }
};
const process_dt2 = () => {
  const userAnswers = getDomainAnswers(2, 7);
  const outcome_p1 = traverseTree(D2_P1_DT, userAnswers);
  const outcome_p2 = traverseTree(D2_P2_DT, userAnswers);

  if (outcome_p1 == DomainRisk.Low && outcome_p2 == DomainRisk.Low) {
    document.getElementById("domain-2-judgement").innerHTML = DomainRisk.Low;
  }
  else if (outcome_p1 == DomainRisk.High || outcome_p2 == DomainRisk.High) {
    document.getElementById("domain-2-judgement").innerHTML = DomainRisk.High;
  }
  else if (outcome_p1 == DomainRisk.Concerns || outcome_p2 == DomainRisk.Concerns) {
    document.getElementById("domain-2-judgement").innerHTML = DomainRisk.Concerns;
  }
  else {
    document.getElementById("domain-2-judgement").innerHTML = "Fill out questions.";
  };
};

function runAll() {
  process_dt1();
  process_dt2();

  d2_updateQuestionVisibility();
}

// Attach a click event listener to domain 1 radio buttons.
document.addEventListener("DOMContentLoaded", () => {
  // Attach event listeners to radio buttons in domain 1
  document.querySelectorAll('input[type="radio"][name^="q1_"]').forEach(radio => {
    radio.addEventListener("click", process_dt1);
  });
  document.querySelectorAll('input[type="radio"][name^="q2_"]').forEach(radio => {
    radio.addEventListener("click", process_dt2);
    radio.addEventListener("click", d2_updateQuestionVisibility);
  });
  runAll();

});


// CLEAR STATE IN LOCAL STORAGE
function clearAllState() {
  // Clear all stored radio button and textarea values from localStorage
  localStorage.clear();

  // Optionally, reset the UI elements (radio buttons and textareas)
  document.querySelectorAll("input[type='radio']").forEach(input => {
    input.checked = false; // Uncheck all radio buttons
  });

  document.querySelectorAll("textarea").forEach(textarea => {
    textarea.value = ''; // Clear all textarea values
  });

  runAll();
}

document.getElementById("rob2-clear-button").addEventListener("click", clearAllState);

// Hide functions
function d2_updateQuestionVisibility() {
  const answerQ21 = getAnswer("q2_1");
  const answerQ22 = getAnswer("q2_2");
  const answerQ23 = getAnswer("q2_3");
  const answerQ24 = getAnswer("q2_4");
  const answerQ26 = getAnswer("q2_6");

  // Determine if q2_3 should be shown:
  const showQ23 = [Answer.YES, Answer.PYES, Answer.NOINFO].includes(answerQ21) || [Answer.YES, Answer.PYES, Answer.NOINFO].includes(answerQ22);
  const showQ24 = showQ23 && [Answer.YES, Answer.PYES].includes(answerQ23);
  const showQ25 = showQ24 && [Answer.YES, Answer.PYES, Answer.NOINFO].includes(answerQ24)
  const showQ27 = [Answer.NO, Answer.PNO, Answer.NOINFO].includes(answerQ26)

  const q23Row = document.getElementById("q2_3_row");
  if (q23Row) {
    q23Row.style.display = showQ23 ? "" : "none";
  }
  const q24Row = document.getElementById("q2_4_row");
  if (q24Row) {
    q24Row.style.display = showQ24 ? "" : "none";
  }
  const q25Row = document.getElementById("q2_5_row");
  if (q25Row) {
    q25Row.style.display = showQ25 ? "" : "none";
  }
  const q27Row = document.getElementById("q2_7_row");
  if (q27Row) {
    q27Row.style.display = showQ27 ? "" : "none";
  }
}
