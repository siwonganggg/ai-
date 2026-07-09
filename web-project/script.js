const generateBtn = document.getElementById("generateBtn");
const answerBtn = document.getElementById("answerBtn");

const questionOutput = document.getElementById("questionOutput");
const answerOutput = document.getElementById("answerOutput");
const answerBox = document.getElementById("answerBox");

generateBtn.addEventListener("click", generateQuestion);
answerBtn.addEventListener("click", toggleAnswer);

async function generateQuestion() {

    const studyText = document.getElementById("studyText").value.trim();
    const level = document.getElementById("level").value;
    const count = document.getElementById("count").value;
    const type = document.getElementById("type").value;

    if (studyText === "") {
        alert("공부 내용을 입력하세요.");
        return;
    }

    answerBox.style.display = "none";
    answerBtn.textContent = "정답 보기";

    questionOutput.textContent = "AI가 문제를 생성하는 중입니다...";
    answerOutput.textContent = "";

    try {

        const response = await fetch("/generate", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                studyText,
                level,
                count,
                type
            })

        });

        const data = await response.json();

        if (!response.ok) {
            questionOutput.textContent = "오류 : " + data.error;
            return;
        }

        questionOutput.textContent = data.questions;
        answerOutput.textContent = data.answers;

    }

    catch (err) {

        console.error(err);

        questionOutput.textContent =
            "서버에 연결할 수 없습니다.\n\nnode server.js가 실행 중인지 확인하세요.";

    }

}

function toggleAnswer() {

    if (answerOutput.textContent.trim() === "") {
        alert("먼저 문제를 생성하세요.");
        return;
    }

    if (answerBox.style.display === "none") {

        answerBox.style.display = "block";
        answerBtn.textContent = "정답 숨기기";

    } else {

        answerBox.style.display = "none";
        answerBtn.textContent = "정답 보기";

    }

}
