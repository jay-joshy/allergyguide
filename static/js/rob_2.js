import { getDomainAnswers, traverseTree, D1_DT, D2_P1_DT, D2_P2_DT, D2B_DT, D3_DT, D4_DT, D5_DT } from "./rob_2_decision_trees.js";
import { getAnswer, setup_save_state, DomainRisk, Answer, getDomainAnswerDetails, getMarkdownSummary } from "./rob_2_utils.js"

// SAVE STATE IN LOCAL STORAGE
setup_save_state()

// Function to process and update the decision tree outcome
const process_dt1 = () => {
  const domain = 1;
  const num_q = 3;
  const userAnswers = getDomainAnswers(domain, num_q);
  const outcome = traverseTree(D1_DT, userAnswers);
  const outcomeClass = outcome.toLowerCase().replace(/\s+/g, "-");
  const userDetails = getDomainAnswerDetails(domain, num_q);
  let md_summary = getMarkdownSummary(userAnswers, userDetails);

  if (outcome != "null") {
    document.getElementById(`domain-${domain}-judgement`).innerHTML = `
      <div class="outcome ${outcomeClass}">${outcome}</div>
    `;
    document.getElementById(`domain-${domain}-answers`).innerHTML = `
      <div class="md">${md_summary}</div>
    `;
  }
  else {
    document.getElementById(`domain-${domain}-judgement`).innerHTML = `<div class="outcome ${outcomeClass}">Fill out questions.</div>`;
    document.getElementById(`domain-${domain}-answers`).innerHTML = ``;
  }
};
const process_dt2 = () => {
  const domain = 2;
  const userAnswers = getDomainAnswers(domain, 7);
  const outcome_p1 = traverseTree(D2_P1_DT, userAnswers);
  const outcome_p2 = traverseTree(D2_P2_DT, userAnswers);

  const userDetails = getDomainAnswerDetails(domain, 7);
  let md_summary = getMarkdownSummary(userAnswers, userDetails);


  if (outcome_p1 == DomainRisk.Low && outcome_p2 == DomainRisk.Low) {
    document.getElementById(`domain-${domain}-judgement`).innerHTML = `
      <div class="outcome low-risk">${DomainRisk.Low}</div>
    `;
    document.getElementById("domain-2-answers").innerHTML = `
      <div class="md">${md_summary}</div>
    `;
  }
  else if (outcome_p1 == DomainRisk.High || outcome_p2 == DomainRisk.High) {
    document.getElementById(`domain-${domain}-judgement`).innerHTML = `
      <div class="outcome high-risk">${DomainRisk.High}</div>
    `;
    document.getElementById("domain-2-answers").innerHTML = `
      <div class="md">${md_summary}</div>
    `;
  }
  else if (outcome_p1 == DomainRisk.Concerns || outcome_p2 == DomainRisk.Concerns) {
    document.getElementById(`domain-${domain}-judgement`).innerHTML = `
      <div class="outcome some-concerns">${DomainRisk.Concerns}</div>
    `;
    document.getElementById("domain-2-answers").innerHTML = `
      <div class="md">${md_summary}</div>
    `;
  }
  else {
    document.getElementById("domain-2-judgement").innerHTML = `<div class="outcome">Fill out questions.</div>`;
    document.getElementById("domain-2-answers").innerHTML = ``;

  };
};
const process_dt2b = () => {
  const domain = "2b";
  const num_q = 6;
  const tree = D2B_DT;

  const userAnswers = getDomainAnswers(domain, num_q);
  const outcome = traverseTree(tree, userAnswers);
  const outcomeClass = outcome.toLowerCase().replace(/\s+/g, "-");
  const userDetails = getDomainAnswerDetails(domain, num_q);
  let md_summary = getMarkdownSummary(userAnswers, userDetails);

  if (outcome != "null") {
    document.getElementById(`domain-${domain}-judgement`).innerHTML = `
      <div class="outcome ${outcomeClass}">${outcome}</div>
    `;
    document.getElementById(`domain-${domain}-answers`).innerHTML = `
      <div class="md">${md_summary}</div>
    `;
  }
  else {
    document.getElementById(`domain-${domain}-judgement`).innerHTML = `<div class="outcome ${outcomeClass}">Fill out questions.</div>`;
    document.getElementById(`domain-${domain}-answers`).innerHTML = ``;
  }
};

const process_dt3 = () => {
  const domain = 3;
  const num_q = 4;
  const tree = D3_DT;

  const userAnswers = getDomainAnswers(domain, num_q);
  const outcome = traverseTree(tree, userAnswers);
  const outcomeClass = outcome.toLowerCase().replace(/\s+/g, "-");
  const userDetails = getDomainAnswerDetails(domain, num_q);
  let md_summary = getMarkdownSummary(userAnswers, userDetails);

  if (outcome != "null") {
    document.getElementById(`domain-${domain}-judgement`).innerHTML = `
      <div class="outcome ${outcomeClass}">${outcome}</div>
    `;
    document.getElementById(`domain-${domain}-answers`).innerHTML = `
      <div class="md">${md_summary}</div>
    `;
  }
  else {
    document.getElementById(`domain-${domain}-judgement`).innerHTML = `<div class="outcome ${outcomeClass}">Fill out questions.</div>`;
    document.getElementById(`domain-${domain}-answers`).innerHTML = ``;
  }

};
const process_dt4 = () => {
  const domain = 4;
  const num_q = 5;
  const tree = D4_DT;

  const userAnswers = getDomainAnswers(domain, num_q);
  const outcome = traverseTree(tree, userAnswers);
  const outcomeClass = outcome.toLowerCase().replace(/\s+/g, "-");
  const userDetails = getDomainAnswerDetails(domain, num_q);
  let md_summary = getMarkdownSummary(userAnswers, userDetails);

  if (outcome != "null") {
    document.getElementById(`domain-${domain}-judgement`).innerHTML = `
      <div class="outcome ${outcomeClass}">${outcome}</div>
    `;
    document.getElementById(`domain-${domain}-answers`).innerHTML = `
      <div class="md">${md_summary}</div>
    `;
  }
  else {
    document.getElementById(`domain-${domain}-judgement`).innerHTML = `<div class="outcome ${outcomeClass}">Fill out questions.</div>`;
    document.getElementById(`domain-${domain}-answers`).innerHTML = ``;
  }


};
const process_dt5 = () => {
  const domain = 5;
  const num_q = 3;
  const tree = D5_DT;

  const userAnswers = getDomainAnswers(domain, num_q);
  const outcome = traverseTree(tree, userAnswers);
  const outcomeClass = outcome.toLowerCase().replace(/\s+/g, "-");
  const userDetails = getDomainAnswerDetails(domain, num_q);
  let md_summary = getMarkdownSummary(userAnswers, userDetails);

  if (outcome != "null") {
    document.getElementById(`domain-${domain}-judgement`).innerHTML = `
      <div class="outcome ${outcomeClass}">${outcome}</div>
    `;
    document.getElementById(`domain-${domain}-answers`).innerHTML = `
      <div class="md">${md_summary}</div>
    `;
  }
  else {
    document.getElementById(`domain-${domain}-judgement`).innerHTML = `<div class="outcome ${outcomeClass}">Fill out questions.</div>`;
    document.getElementById(`domain-${domain}-answers`).innerHTML = ``;
  }


};


function runAll() {
  process_dt1();
  process_dt2();
  process_dt2b();
  process_dt3();
  process_dt4();
  process_dt5();
  d2b_updateQuestionVisibility();
  d2_updateQuestionVisibility();
  d3_updateQuestionVisibility();
  d4_updateQuestionVisibility();
}

// Attach a click event listener to domain 1 radio buttons.
document.addEventListener("DOMContentLoaded", () => {
  // Attach event listeners to radio buttons in domain 1
  document.querySelectorAll('input[type="radio"][name^="q1_"]').forEach(radio => {
    radio.addEventListener("click", process_dt1);
  });
  document.querySelectorAll("textarea.question-details.q1").forEach(textarea => {
    textarea.addEventListener("input", (event) => {
      process_dt1();
    });
  });

  document.querySelectorAll('input[type="radio"][name^="q2_"]').forEach(radio => {
    radio.addEventListener("click", process_dt2);
    radio.addEventListener("click", d2_updateQuestionVisibility);
  });
  document.querySelectorAll("textarea.question-details.q2").forEach(textarea => {
    textarea.addEventListener("input", (event) => {
      process_dt2();
    });
  });

  document.querySelectorAll('input[type="radio"][name^="q2b_"]').forEach(radio => {
    radio.addEventListener("click", process_dt2b);
    radio.addEventListener("click", d2b_updateQuestionVisibility);
  });
  document.querySelectorAll("textarea.question-details.q2b").forEach(textarea => {
    textarea.addEventListener("input", (event) => {
      process_dt2b();
    });
  });

  document.querySelectorAll('input[type="radio"][name^="q3_"]').forEach(radio => {
    radio.addEventListener("click", process_dt3);
    radio.addEventListener("click", d3_updateQuestionVisibility);
  });
  document.querySelectorAll("textarea.question-details.q3").forEach(textarea => {
    textarea.addEventListener("input", (event) => {
      process_dt3();
    });
  });

  document.querySelectorAll('input[type="radio"][name^="q4_"]').forEach(radio => {
    radio.addEventListener("click", process_dt4);
    radio.addEventListener("click", d4_updateQuestionVisibility);
  });
  document.querySelectorAll("textarea.question-details.q4").forEach(textarea => {
    textarea.addEventListener("input", (event) => {
      process_dt4();
    });
  });

  document.querySelectorAll('input[type="radio"][name^="q5_"]').forEach(radio => {
    radio.addEventListener("click", process_dt5);
  });
  document.querySelectorAll("textarea.question-details.q5").forEach(textarea => {
    textarea.addEventListener("input", (event) => {
      process_dt5();
    });
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

function d2b_updateQuestionVisibility() {
  const answerQ21b = getAnswer("q2b_1");
  const answerQ22b = getAnswer("q2b_2");
  const answerQ23b = getAnswer("q2b_3");
  const answerQ24b = getAnswer("q2b_4");
  const answerQ25b = getAnswer("q2b_5");

  // Determine if q2_3 should be shown:
  const showQ23b = [Answer.YES, Answer.PYES, Answer.NOINFO].includes(answerQ21b) || [Answer.YES, Answer.PYES, Answer.NOINFO].includes(answerQ22b);
  const showQ26b = [Answer.NO, Answer.PNO, Answer.NOINFO].includes(answerQ23b) || [Answer.YES, Answer.PYES, Answer.NOINFO].includes(answerQ24b) || [Answer.YES, Answer.PYES, Answer.NOINFO].includes(answerQ25b);

  const q23Row_b = document.getElementById("q2b_3_row");
  if (q23Row_b) {
    q23Row_b.style.display = showQ23b ? "" : "none";
  }
  const q26Row_b = document.getElementById("q2b_6_row");
  if (q26Row_b) {
    q26Row_b.style.display = showQ26b ? "" : "none";
  }

}

function d3_updateQuestionVisibility() {
  const answerQ31 = getAnswer("q3_1");
  const answerQ32 = getAnswer("q3_2");
  const answerQ33 = getAnswer("q3_3");

  // Determine if q2_3 should be shown:
  const showQ32 = [Answer.NO, Answer.PNO, Answer.NOINFO].includes(answerQ31);
  const showQ33 = [Answer.NO, Answer.PNO].includes(answerQ32);
  const showQ34 = [Answer.YES, Answer.PYES, Answer.NOINFO].includes(answerQ33);

  const q32Row = document.getElementById("q3_2_row");
  if (q32Row) {
    q32Row.style.display = showQ32 ? "" : "none";
  }
  const q33Row = document.getElementById("q3_3_row");
  if (q33Row) {
    q33Row.style.display = showQ33 ? "" : "none";
  }
  const q34Row = document.getElementById("q3_4_row");
  if (q34Row) {
    q34Row.style.display = showQ34 ? "" : "none";
  }

}
function d4_updateQuestionVisibility() {
  const answerQ41 = getAnswer("q4_1");
  const answerQ42 = getAnswer("q4_2");
  const answerQ43 = getAnswer("q4_3");
  const answerQ44 = getAnswer("q4_4");

  // Determine if q2_3 should be shown:
  const showQ43 = [Answer.NO, Answer.PNO, Answer.NOINFO].includes(answerQ41) && [Answer.NO, Answer.PNO, Answer.NOINFO].includes(answerQ42);
  const showQ44 = [Answer.YES, Answer.PYES, Answer.NOINFO].includes(answerQ43);
  const showQ45 = [Answer.YES, Answer.PYES, Answer.NOINFO].includes(answerQ44);

  const q43Row = document.getElementById("q4_3_row");
  if (q43Row) {
    q43Row.style.display = showQ43 ? "" : "none";
  }
  const q44Row = document.getElementById("q4_4_row");
  if (q44Row) {
    q44Row.style.display = showQ44 ? "" : "none";
  }
  const q45Row = document.getElementById("q4_5_row");
  if (q45Row) {
    q45Row.style.display = showQ45 ? "" : "none";
  }
}
