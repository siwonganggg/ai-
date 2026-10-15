let currentQuestion = "";
let currentAnswer = "";

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
        answerOutput.textContent = "여기에 정답이 표시됩니다.";
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

        if (!currentQuestion) {
            throw new Error("생성된 문제를 불러오지 못했습니다.");
        }

        setQuestionMessage(currentQuestion, "success");

        const answerOutput = getElement("answerOutput");

        if (answerOutput && currentAnswer) {
            answerOutput.textContent = currentAnswer;
        }
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

function showAnswer() {
    const answerBox = getElement("answerBox");
    const answerOutput = getElement("answerOutput");

    if (!answerBox || !answerOutput) {
        return;
    }

    answerBox.style.display = "block";

    if (!currentAnswer) {
        answerOutput.className = "error";
        answerOutput.textContent = "먼저 문제를 생성해주세요.";
        return;
    }

    answerOutput.className = "success";
    answerOutput.textContent = currentAnswer;

    answerBox.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}
