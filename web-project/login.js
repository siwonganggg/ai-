// ========================================
// AI 문제 생성기 - 로그인
// ========================================


// ========================================
// 페이지 로딩
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    // 저장된 테마 적용
    applyTheme();

    // 테마 버튼 연결
    const themeToggle =
        document.getElementById("themeToggle");

    if (themeToggle) {

        themeToggle.addEventListener(
            "click",
            toggleTheme
        );

    }


    // 로그인 폼 연결
    const loginForm =
        document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            login
        );

    }

});


// ========================================
// 테마 적용
// ========================================

function applyTheme() {

    const savedTheme =
        localStorage.getItem("theme") || "light";


    if (savedTheme === "dark") {

        document.body.classList.add("dark-mode");

    } else {

        document.body.classList.remove("dark-mode");

    }


    updateThemeButton();

}


// ========================================
// 테마 버튼 글자 변경
// ========================================

function updateThemeButton() {

    const button =
        document.getElementById("themeToggle");

    if (!button) return;


    if (
        document.body.classList.contains("dark-mode")
    ) {

        button.textContent = "라이트 모드";

    } else {

        button.textContent = "다크 모드";

    }

}


// ========================================
// 다크 / 라이트 모드 변경
// ========================================

function toggleTheme() {

    const isDark =
        document.body.classList.contains("dark-mode");


    if (isDark) {

        // 라이트 모드
        document.body.classList.remove("dark-mode");

        localStorage.setItem(
            "theme",
            "light"
        );

    } else {

        // 다크 모드
        document.body.classList.add("dark-mode");

        localStorage.setItem(
            "theme",
            "dark"
        );

    }


    updateThemeButton();

}


// ========================================
// 로그인
// ========================================

async function login(event) {

    event.preventDefault();


    const usernameInput =
        document.getElementById("username");

    const passwordInput =
        document.getElementById("password");


    if (!usernameInput || !passwordInput) {

        console.error(
            "로그인 입력창을 찾을 수 없습니다."
        );

        return;

    }


    const username =
        usernameInput.value.trim();

    const password =
        passwordInput.value;


    // 입력 확인

    if (!username) {

        showMessage(
            "아이디를 입력해주세요.",
            "error"
        );

        usernameInput.focus();

        return;

    }


    if (!password) {

        showMessage(
            "비밀번호를 입력해주세요.",
            "error"
        );

        passwordInput.focus();

        return;

    }


    showMessage(
        "로그인 중...",
        "loading"
    );


    try {

        const response =
            await fetch("/api/login", {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    username: username,

                    password: password

                })

            });


        // 서버 응답 확인

        let data;

        try {

            data =
                await response.json();

        } catch (jsonError) {

            throw new Error(
                "서버에서 올바른 응답을 받지 못했습니다."
            );

        }


        // 로그인 실패

        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "아이디 또는 비밀번호가 올바르지 않습니다."
            );

        }


        // ========================================
        // ★ 로그인 상태 저장
        // ========================================

        if (
            !data.user ||
            !data.user.username
        ) {

            throw new Error(
                "로그인 정보가 올바르게 전달되지 않았습니다."
            );

        }


        // 사용자 이름 저장

        localStorage.setItem(
            "username",
            data.user.username
        );


        // 사용자 ID 저장

        if (data.user.id) {

            localStorage.setItem(
                "userId",
                data.user.id
            );

        }


        // 로그인 상태 저장

        localStorage.setItem(
            "isLoggedIn",
            "true"
        );


        // ========================================
        // 테마는 절대 삭제하지 않음
        // ========================================

        // localStorage.clear() 사용 금지
        //
        // 로그인 정보:
        // username
        // userId
        // isLoggedIn
        //
        // 테마:
        // theme
        //
        // theme은 그대로 유지


        showMessage(
            `${data.user.username}님 로그인 성공!`,
            "success"
        );


        // ========================================
        // 메인 페이지 이동
        // ========================================

        setTimeout(() => {

            window.location.href =
                "index.html";

        }, 500);


    } catch (error) {

        console.error(
            "로그인 오류:",
            error
        );


        showMessage(
            error.message ||
            "로그인 중 오류가 발생했습니다.",
            "error"
        );

    }

}


// ========================================
// 메시지 표시
// ========================================

function showMessage(
    text,
    type = ""
) {

    const message =
        document.getElementById("message");


    if (!message) return;


    message.textContent = text;


    // 기존 클래스 제거

    message.className = "message";


    // 새로운 클래스 추가

    if (type) {

        message.classList.add(type);

    }

}
