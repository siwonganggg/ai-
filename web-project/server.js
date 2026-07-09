const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.post("/generate", async (req, res) => {
  try {
    const { studyText, level, count, type } = req.body;

    if (!studyText) {
      return res.status(400).json({
        error: "공부 내용을 입력하세요."
      });
    }

    const prompt = `
다음 학습 내용을 바탕으로 ${type} 문제 ${count}개를 만들어라.

난이도 : ${level}

조건
- 객관식이면 4지선다(①②③④)
- OX면 O/X 문제
- 주관식이면 서술형
- 마지막에 반드시 [정답]을 따로 작성한다.

형식

[문제]

...

[정답]

...

학습 내용

${studyText}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const text = response.text;

    const parts = text.split("[정답]");

    res.json({
      questions: parts[0] || text,
      answers: parts[1] || "정답이 없습니다."
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }
});

app.listen(3000, () => {
  console.log("서버 실행");
  console.log("http://localhost:3000");
});
