// ========================================
// AI 문제 생성기
// 공통 로그인 / 테마 관리
// ========================================


// ========================================
// 현재 사용자
// ========================================

function getCurrentUser() {

    const username =
        localStorage.getItem("username");

    const userId =
        localStorage.getItem("userId");

    if (!username) {
        return null;
    }

    return {
        username: username,
        id: userId
    };
}


// ========================================
// 로그인 여부
// ========================================

function isLoggedIn() {

    return !!localStorage.getItem("username");

}


// ========================================
// 로그인 저장
// ========================================

function saveLogin(user) {

    if (!user || !user.username) {
        return false;
    }

    localStorage.setItem(
        "username",
        user.username
    );

    if (user.id) {

        localStorage.setItem(
            "userId",
            user.id
        );

    }

    localStorage.setItem(
        "isLoggedIn",
        "true"
    );

    return true;
}


// ========================================
// 로그아웃
// ========================================

function logout() {

    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem("isLoggedIn");

    // ★ theme은 절대 삭제하지 않음

    window.location.href =
        "index.html";
}


// ========================================
// 사용자 영역
// ========================================

function updateUserArea() {

    const user =
        getCurrentUser();

    const welcomeMessage =
        document.getElementById(
            "welcomeMessage"
        );

    const loginBtn =
        document.getElementById(
            "loginBtn"
        );

    const signupBtn =
        document.getElementById(
            "signupBtn"
        );

    const historyBtn =
        document.getElementById(
            "historyBtn"
        );

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );


    if (user) {

        if (welcomeMessage) {

            welcomeMessage.textContent =
                `${user.username}님 환영합니다!`;

        }

        if (loginBtn) {
            loginBtn.style.display = "none";
        }

        if (signupBtn) {
            signupBtn.style.display = "none";
        }

        if (historyBtn) {
            historyBtn.style.display = "inline-block";
        }

        if (logoutBtn) {
            logoutBtn.style.display = "inline-block";
        }

    } else {

        if (welcomeMessage) {

            welcomeMessage.textContent =
                "로그인해주세요.";

        }

        if (loginBtn) {
            loginBtn.style.display = "inline-block";
        }

        if (signupBtn) {
            signupBtn.style.display = "inline-block";
        }

        if (historyBtn) {
            historyBtn.style.display = "none";
        }

        if (logoutBtn) {
            logoutBtn.style.display = "none";
        }

    }
}


// ========================================
// 테마 적용
// ========================================

function applySavedTheme() {

    const theme =
        localStorage.getItem("theme") || "light";

    if (theme === "dark") {

        document.body.classList.add(
            "dark-mode"
        );

    } else {

        document.body.classList.remove(
            "dark-mode"
        );

    }
}


// ========================================
// 테마 버튼 글자
// ========================================

function updateThemeButton() {

    const button =
        document.getElementById(
            "themeToggle"
        );

    if (!button) return;

    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );

    button.textContent =
        isDark
            ? "라이트 모드"
            : "다크 모드";
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

        document.body.classList.remove(
            "dark-mode"
        );

        localStorage.setItem(
            "theme",
            "light"
        );

    } else {

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
// 공통 초기화
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        applySavedTheme();

        updateThemeButton();

        updateUserArea();


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


        const logoutBtn =
            document.getElementById(
                "logoutBtn"
            );

        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                logout
            );

        }

    }
);
