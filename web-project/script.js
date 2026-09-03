// ========================================
// AI 문제 생성기
// 메인 페이지
// ========================================


// ========================================
// HTML 요소
// ========================================

const studyText =
    document.getElementById("studyText");

const level =
    document.getElementById("level");

const count =
    document.getElementById("count");

const type =
    document.getElementById("type");

const generateBtn =
    document.getElementById("generateBtn");

const answerBtn =
    document.getElementById("answerBtn");

const questionOutput =
    document.getElementById("questionOutput");

const answerOutput =
    document.getElementById("answerOutput");

const answerBox =
    document.getElementById("answerBox");


// ========================================
// 현재 문제 저장
// ========================================

let currentQuestion = "";

let currentAnswer = "";


// ========================================
// 페이지 시작
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeTheme();

        initializeUser();

        initializeButtons();

    }
);


// ========================================
// 테마 초기화
// ========================================

function initializeTheme() {

    const savedTheme =
        localStorage.getItem("theme") || "light";


    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark-mode"
        );

    } else {

        document.body.classList.remove(
            "dark-mode"
        );

    }


    updateThemeButton();

}


// ========================================
// 테마 버튼
// ========================================

function updateThemeButton() {

    const themeToggle =
        document.getElementById(
            "themeToggle"
        );


    if (!themeToggle) return;


    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );


    if (isDark) {

        themeToggle.textContent =
            "라이트 모드";

    } else {

        themeToggle.textContent =
            "다크 모드";

    }

}


// ========================================
// 테마 변경
// ========================================

function toggleTheme() {

    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );


    if (isDark) {

        // 라이트 모드

        document.body.classList.remove(
            "dark-mode"
        );

        localStorage.setItem(
            "theme",
            "light"
        );

    } else {

        // 다크 모드

        document.body.classList.add(
            "dark-mode"
        );

        localStorage.setItem(
            "theme",
            "dark"
        );

    }


    updateThemeButton();

}


// ========================================
// 사용자 정보 초기화
// ========================================

function initializeUser() {

    // auth.js의 함수 사용

    if (
        typeof updateUserArea ===
        "function"
    ) {

        updateUserArea();

    }

}


// ========================================
// 버튼 연결
// ========================================

function initializeButtons() {

    const themeToggle =
        document.getElementById(
            "themeToggle"
        );


    if (themeToggle) {

        themeToggle.addEventListener(
            "click",
            toggleTheme
        );

    }


    if (generateBtn) {

        generateBtn.addEventListener(
            "click",
            generateQuestion
        );

    }


    if (answerBtn) {

        answerBtn.addEventListener(
            "click",
            showAnswer
        );

    }

}


// ========================================
// 문제 생성
// ========================================

async function generateQuestion() {

    // =====================================
    // 입력값
    // =====================================

    const text =
        studyText.value.trim();


    const selectedLevel =
        level.value;


    const selectedCount =
        count.value;


    const selectedType =
        type.value;


    // =====================================
    // 입력 확인
    // =====================================

    if (!text) {

        questionOutput.textContent =
            "먼저 공부한 내용을 입력해주세요.";

        questionOutput.className =
            "error";

        return;

    }


    // =====================================
    // 버튼 비활성화
    // =====================================

    generateBtn.disabled = true;

    generateBtn.textContent =
        "문제 생성 중...";


    // =====================================
    // 결과 초기화
    // =====================================

    questionOutput.className =
        "loading";

    questionOutput.textContent =
        "AI가 문제를 생성하고 있습니다...";


    answerOutput.textContent =
        "여기에 정답이 표시됩니다.";


    answerBox.style.display =
        "none";


    currentQuestion = "";

    currentAnswer = "";


    try {

        // ==================================
        // 로그인한 사용자 가져오기
        // ==================================

        let username =
            localStorage.getItem(
                "username"
            );


        // ==================================
        // 서버 요청
        // ==================================

        const response =
            await fetch(
                "/generate",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        studyText: text,

                        level:
                            selectedLevel,

                        count:
                            selectedCount,

                        type:
                            selectedType,

                        username:
                            username || null

                    })

                }
            );


        // ==================================
        // 서버 응답
        // ==================================

        let data;


        try {

            data =
                await response.json();

        } catch (jsonError) {

            throw new Error(
                "서버에서 올바른 응답을 받지 못했습니다."
            );

        }


        // ==================================
        // 서버 오류
        // ==================================

        if (!response.ok) {

            throw new Error(

                data.error ||
                "문제 생성 중 서버 오류가 발생했습니다."

            );

        }


        // ==================================
        // 문제 저장
        // ==================================

        currentQuestion =
            data.questions || "";


        currentAnswer =
            data.answers || "";


        // ==================================
        // 문제 출력
        // ==================================

        if (currentQuestion) {

            questionOutput.className =
                "success";

            questionOutput.textContent =
                currentQuestion;

        } else {

            questionOutput.className =
                "error";

            questionOutput.textContent =
                "문제를 생성하지 못했습니다.";

        }


        // ==================================
        // 정답 저장
        // ==================================

        if (currentAnswer) {

            answerOutput.textContent =
                currentAnswer;

        }


    } catch (error) {

        console.error(
            "문제 생성 오류:",
            error
        );


        questionOutput.className =
            "error";


        // ==================================
        // 오류 메시지
        // ==================================

        if (
            error.message.includes("Failed to fetch")
        ) {

            questionOutput.textContent =
                "서버에 연결할 수 없습니다.\n\n" +
                "터미널에서 서버가 실행 중인지 확인해주세요.\n\n" +
                "node server.js";

        } else {

            questionOutput.textContent =
                "문제 생성에 실패했습니다.\n\n" +
                error.message;

        }

    } finally {

        // ==================================
        // 버튼 복구
        // ==================================

        generateBtn.disabled =
            false;

        generateBtn.textContent =
            "문제 생성하기";

    }

}


// ========================================
// 정답 보기
// ========================================

function showAnswer() {

    // 정답이 아직 없는 경우

    if (!currentAnswer) {

        answerBox.style.display =
            "block";

        answerOutput.className =
            "error";

        answerOutput.textContent =
            "먼저 문제를 생성해주세요.";

        return;

    }


    // =====================================
    // 정답 표시
    // =====================================

    answerBox.style.display =
        "block";


    answerOutput.className =
        "success";


    answerOutput.textContent =
        currentAnswer;


    // 정답 위치로 이동

    answerBox.scrollIntoView({

        behavior: "smooth",

        block: "start"

    });

}


// ========================================
// Enter 방지
// ========================================

if (studyText) {

    studyText.addEventListener(
        "keydown",
        (event) => {

            // textarea에서는 Enter 허용

            if (event.key === "Enter") {

                return;

            }

        }
    );

}
