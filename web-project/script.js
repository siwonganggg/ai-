let currentQuestion = "";
let currentAnswer = "";
let currentQuiz = null;
let currentHistoryId = null;

document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeUser();
    initializeButtons();
});

function getElement(id) {
    return document.getElementById(id);
}

function initializeTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";

    document.body.classList.toggle(
        "dark-mode",
        savedTheme === "dark"
    );

    updateThemeButton();
}

function updateThemeButton() {
    const themeToggle = getElement("themeToggle");

    if (!themeToggle) {
        return;
    }

    themeToggle.textContent = document.body.classList.contains("dark-mode")
        ? "라이트 모드"
        : "다크 모드";
}

function toggleTheme() {
    const isDark = document.body.classList.toggle("dark-mode");

    localStorage.setItem(
        "theme",
        isDark ? "dark" : "light"
    );

    updateThemeButton();
}

function initializeUser() {
    // auth.js가 있다면 로그인 영역을 갱신합니다.
    if (typeof updateUserArea === "function") {
        updateUserArea();
    }
}

function initializeButtons() {
    const themeToggle = getElement("themeToggle");
    const generateBtn = getElement("generateBtn");
    const answerBtn = getElement("answerBtn");

    if (themeToggle) {
        themeToggle.addEventListener("click", toggleTheme);
    }

    if (generateBtn) {
        generateBtn.addEventListener("click", generateQuestion);
    }

    if (answerBtn) {
        answerBtn.addEventListener("click", showAnswer);
    }
}

function setQuestionMessage(message, className) {
    const questionOutput = getElement("questionOutput");

    if (!questionOutput) {
        return;
    }

    questionOutput.className = className;
    questionOutput.textContent = message;
}

function resetAnswerArea() {
    const answerOutput = getElement("answerOutput");
    const answerBox = getElement("answerBox");

    if (answerOutput) {
        answerOutput.className = "";
        answerOutput.textContent = "정답 확인을 누르면 결과와 해설이 표시됩니다.";
    }

    if (answerBox) {
        answerBox.style.display = "none";
    }
}

async function generateQuestion() {
    const studyText = getElement("studyText");
    const level = getElement("level");
    const count = getElement("count");
    const type = getElement("type");
    const generateBtn = getElement("generateBtn");

    if (!studyText || !level || !count || !type || !generateBtn) {
        console.error("문제 생성에 필요한 화면 요소를 찾을 수 없습니다.");
        return;
    }

    const text = studyText.value.trim();

    if (!text) {
        setQuestionMessage(
            "먼저 공부한 내용을 입력해주세요.",
            "error"
        );
        studyText.focus();
        return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = "문제 생성 중...";

    currentQuestion = "";
    currentAnswer = "";
    currentQuiz = null;
    currentHistoryId = null;

    setQuestionMessage(
        "AI가 문제를 생성하고 있습니다...",
        "loading"
    );

    resetAnswerArea();

    try {
        const response = await fetch("/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                studyText: text,
                level: level.value,
                count: count.value,
                type: type.value,
                // 로그인하지 않아도 문제 생성은 가능하고,
                // 로그인한 경우에만 서버가 기록을 저장합니다.
                username: localStorage.getItem("username") || null
            })
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error(
                "서버에서 올바른 응답을 받지 못했습니다."
            );
        }

        if (!response.ok || !data.success) {
            throw new Error(
                data.error || "문제 생성에 실패했습니다."
            );
        }

        currentQuestion = String(data.questions || "").trim();
        currentAnswer = String(data.answers || "").trim();
        currentQuiz = data.quiz;
        currentHistoryId = data.historyId || null;

        if (!currentQuestion || !Array.isArray(currentQuiz?.questions)) {
            throw new Error("생성된 문제를 불러오지 못했습니다.");
        }

        renderQuiz(currentQuiz.questions, currentQuiz.type);
    } catch (error) {
        console.error("문제 생성 오류:", error);

        const message = String(error?.message || "");

        if (message.includes("Failed to fetch")) {
            setQuestionMessage(
                "서버에 연결할 수 없습니다.\n\n" +
                    "터미널에서 서버가 실행 중인지 확인해주세요.\n\n" +
                    "node server.js",
                "error"
            );
        } else {
            setQuestionMessage(
                "문제 생성에 실패했습니다.\n\n" + message,
                "error"
            );
        }
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = "문제 생성하기";
    }
}

async function showAnswer() {
    const answerBox = getElement("answerBox");
    const answerOutput = getElement("answerOutput");

    if (!answerBox || !answerOutput) {
        return;
    }

    if (!currentQuiz?.questions?.length) {
        answerBox.style.display = "block";
        answerOutput.className = "error";
        answerOutput.textContent = "먼저 문제를 생성해주세요.";
        return;
    }

    const results = currentQuiz.questions.map((question, index) => {
        const card = document.querySelector(`[data-question-index="${index}"]`);
        const selected = card?.querySelector(".quiz-choice.selected");
        const input = card?.querySelector(".short-answer-input");
        const submitted = selected
            ? selected.dataset.choice
            : String(input?.value || "").trim();
        const correct = isCorrectAnswer(question, submitted);

        card?.classList.toggle("is-correct", correct);
        card?.classList.toggle("is-incorrect", !correct);

        card?.querySelectorAll(".quiz-choice").forEach((button) => {
            button.disabled = true;
            if (isCorrectAnswer(question, button.dataset.choice)) {
                button.classList.add("correct-choice");
            } else if (button.classList.contains("selected")) {
                button.classList.add("incorrect-choice");
            }
        });
        if (input) input.disabled = true;

        return {
            number: index + 1,
            submitted,
            correct,
            answer: question.answer,
            explanation: question.explanation
        };
    });

    renderResults(results);
    answerBox.style.display = "block";

    await saveQuizResults(results);

    answerBox.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

async function saveQuizResults(results) {
    const username = localStorage.getItem("username");

    if (!username || !currentHistoryId) return;

    try {
        const response = await fetch(
            `/api/history/${encodeURIComponent(username)}/${encodeURIComponent(currentHistoryId)}/results`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    results: results.map(({ number, submitted, correct }) => ({ number, submitted, correct }))
                })
            }
        );

        if (!response.ok) {
            throw new Error("풀이 결과를 기록에 저장하지 못했습니다.");
        }
    } catch (error) {
        console.error("풀이 결과 저장 오류:", error);
    }
}

function renderQuiz(questions, type) {
    const questionOutput = getElement("questionOutput");
    if (!questionOutput) return;

    questionOutput.className = "quiz-list";
    questionOutput.replaceChildren();

    questions.forEach((question, index) => {
        const card = document.createElement("section");
        card.className = "quiz-card";
        card.dataset.questionIndex = String(index);

        const title = document.createElement("h3");
        title.textContent = `${index + 1}. ${question.question}`;
        card.appendChild(title);

        if (type === "주관식") {
            const input = document.createElement("input");
            input.type = "text";
            input.className = "short-answer-input";
            input.placeholder = "정답을 입력하세요";
            input.autocomplete = "off";
            card.appendChild(input);
        } else {
            const choices = document.createElement("div");
            choices.className = "choice-list";
            question.choices.forEach((choice, choiceIndex) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "quiz-choice";
                button.dataset.choice = choice;
                button.textContent = `${["①", "②", "③", "④"][choiceIndex] || `${choiceIndex + 1}.`} ${choice}`;
                button.addEventListener("click", () => selectChoice(card, button));
                choices.appendChild(button);
            });
            card.appendChild(choices);
        }

        questionOutput.appendChild(card);
    });
}

function selectChoice(card, selectedButton) {
    card.querySelectorAll(".quiz-choice").forEach((button) => button.classList.remove("selected"));
    selectedButton.classList.add("selected");
}

function normalizeAnswer(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[.!,?]/g, "");
}

function isCorrectAnswer(question, submitted) {
    const answer = normalizeAnswer(question.answer);
    const value = normalizeAnswer(submitted);
    return Boolean(value) && answer.split(/[|/]/).some((item) => normalizeAnswer(item) === value);
}

function renderResults(results) {
    const answerOutput = getElement("answerOutput");
    if (!answerOutput) return;

    const correctCount = results.filter((result) => result.correct).length;
    answerOutput.className = correctCount === results.length ? "success" : "error";
    answerOutput.replaceChildren();

    const summary = document.createElement("p");
    summary.className = "score-summary";
    summary.textContent = `${results.length}문제 중 ${correctCount}문제 정답`;
    answerOutput.appendChild(summary);

    results.forEach((result) => {
        const detail = document.createElement("section");
        detail.className = `answer-feedback ${result.correct ? "correct" : "incorrect"}`;
        const status = document.createElement("strong");
        status.textContent = `${result.number}번: ${result.correct ? "정답" : "오답"}`;
        const answer = document.createElement("p");
        answer.textContent = `정답: ${result.answer}`;
        const explanation = document.createElement("p");
        explanation.textContent = `해설: ${result.explanation}`;
        detail.append(status, answer, explanation);
        answerOutput.appendChild(detail);
    });
}
