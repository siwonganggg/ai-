const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const ROOT = __dirname;

// server.js와 같은 폴더의 .env만 명확히 읽습니다.
dotenv.config({ path: path.join(ROOT, ".env") });

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.join(ROOT, "users.json");

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(ROOT));

function loadUsers() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, "[]", "utf8");
    }

    const text = fs.readFileSync(DATA_FILE, "utf8").trim();

    if (!text) {
        return [];
    }

    const users = JSON.parse(text);

    if (!Array.isArray(users)) {
        throw new Error("users.json 형식이 올바르지 않습니다.");
    }

    return users;
}

function saveUsers(users) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(users, null, 2),
        "utf8"
    );
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
        .scryptSync(password, salt, 64)
        .toString("hex");

    return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
    try {
        const [salt, storedHash] = String(storedPassword).split(":");

        if (!salt || !storedHash) {
            return false;
        }

        const hash = crypto
            .scryptSync(password, salt, 64)
            .toString("hex");

        const savedBuffer = Buffer.from(storedHash, "hex");
        const enteredBuffer = Buffer.from(hash, "hex");

        if (savedBuffer.length !== enteredBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(savedBuffer, enteredBuffer);
    } catch {
        return false;
    }
}

function findUser(users, username) {
    return users.find((user) => user.username === username);
}

function saveHistoryForUser(users, username, history) {
    const user = findUser(users, username);

    if (!user) {
        return false;
    }

    if (!Array.isArray(user.history)) {
        user.history = [];
    }

    user.history.unshift(history);
    saveUsers(users);
    return true;
}

function getGeminiError(error) {
    const message = String(error?.message || "");

    if (
        /ACCOUNT_STATE_INVALID|401 Unauthorized|API_KEY_INVALID|API key not valid/i.test(
            message
        )
    ) {
        return {
            status: 502,
            message:
                "Gemini API 인증에 실패했습니다. .env의 GEMINI_API_KEY를 확인하고, Google AI Studio 또는 Google Cloud에서 해당 키에 연결된 프로젝트와 서비스 계정이 활성 상태인지 확인해주세요."
        };
    }

    if (/429|quota|RESOURCE_EXHAUSTED/i.test(message)) {
        return {
            status: 429,
            message:
                "Gemini 사용량 한도에 도달했습니다. 잠시 후 다시 시도하거나 Google AI Studio의 사용량 및 결제 설정을 확인해주세요."
        };
    }

    if (/403|PERMISSION_DENIED/i.test(message)) {
        return {
            status: 502,
            message:
                "Gemini API 사용 권한이 없습니다. API 키의 프로젝트 설정과 Gemini API 사용 가능 여부를 확인해주세요."
        };
    }

    return {
        status: 502,
        message:
            "AI 문제 생성 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해주세요."
    };
}

// 회원가입
app.post("/api/signup", (req, res) => {
    try {
        const username = String(req.body?.username || "").trim();
        const password = String(req.body?.password || "");

        if (!username || !password) {
            return res.status(400).json({
                error: "아이디와 비밀번호를 입력해주세요."
            });
        }

        if (username.length < 2) {
            return res.status(400).json({
                error: "아이디는 2자 이상이어야 합니다."
            });
        }

        if (password.length < 4) {
            return res.status(400).json({
                error: "비밀번호는 4자 이상이어야 합니다."
            });
        }

        const users = loadUsers();

        if (findUser(users, username)) {
            return res.status(409).json({
                error: "이미 존재하는 아이디입니다."
            });
        }

        users.push({
            id: crypto.randomUUID(),
            username,
            password: hashPassword(password),
            history: [],
            createdAt: new Date().toISOString()
        });

        saveUsers(users);

        res.json({
            success: true,
            message: "회원가입이 완료되었습니다."
        });
    } catch (error) {
        console.error("회원가입 오류:", error.message);

        res.status(500).json({
            error: "회원가입 처리 중 서버 오류가 발생했습니다."
        });
    }
});

// 로그인
app.post("/api/login", (req, res) => {
    try {
        const username = String(req.body?.username || "").trim();
        const password = String(req.body?.password || "");
        const users = loadUsers();
        const user = findUser(users, username);

        if (!user || !verifyPassword(password, user.password)) {
            return res.status(401).json({
                error: "아이디 또는 비밀번호가 틀렸습니다."
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username
            }
        });
    } catch (error) {
        console.error("로그인 오류:", error.message);

        res.status(500).json({
            error: "로그인 처리 중 서버 오류가 발생했습니다."
        });
    }
});

// 기록 직접 저장
app.post("/api/history", (req, res) => {
    try {
        const username = String(req.body?.username || "").trim();

        if (!username) {
            return res.status(400).json({
                error: "로그인이 필요합니다."
            });
        }

        const users = loadUsers();

        if (!findUser(users, username)) {
            return res.status(404).json({
                error: "사용자를 찾을 수 없습니다."
            });
        }

        const history = {
            id: crypto.randomUUID(),
            studyText: String(req.body?.studyText || ""),
            level: String(req.body?.level || "보통"),
            count: Number(req.body?.count) || 5,
            type: String(req.body?.type || "객관식"),
            questions: String(req.body?.questions || ""),
            answers: String(req.body?.answers || ""),
            createdAt: new Date().toISOString()
        };

        saveHistoryForUser(users, username, history);

        res.json({
            success: true,
            message: "문제 기록이 저장되었습니다.",
            history
        });
    } catch (error) {
        console.error("기록 저장 오류:", error.message);

        res.status(500).json({
            error: "기록 저장 중 서버 오류가 발생했습니다."
        });
    }
});

// 기록 조회
app.get("/api/history/:username", (req, res) => {
    try {
        const username = String(req.params.username || "").trim();
        const users = loadUsers();
        const user = findUser(users, username);

        if (!user) {
            return res.status(404).json({
                error: "사용자를 찾을 수 없습니다."
            });
        }

        res.json({
            success: true,
            history: Array.isArray(user.history) ? user.history : []
        });
    } catch (error) {
        console.error("기록 조회 오류:", error.message);

        res.status(500).json({
            error: "기록 조회 중 서버 오류가 발생했습니다."
        });
    }
});

// 기록 삭제
app.delete("/api/history/:username/:historyId", (req, res) => {
    try {
        const username = String(req.params.username || "").trim();
        const historyId = String(req.params.historyId || "");
        const users = loadUsers();
        const user = findUser(users, username);

        if (!user) {
            return res.status(404).json({
                error: "사용자를 찾을 수 없습니다."
            });
        }

        const history = Array.isArray(user.history) ? user.history : [];
        const beforeCount = history.length;

        user.history = history.filter((item) => item.id !== historyId);

        if (beforeCount === user.history.length) {
            return res.status(404).json({
                error: "삭제할 기록을 찾을 수 없습니다."
            });
        }

        saveUsers(users);

        res.json({
            success: true,
            message: "기록이 삭제되었습니다."
        });
    } catch (error) {
        console.error("기록 삭제 오류:", error.message);

        res.status(500).json({
            error: "기록 삭제 중 서버 오류가 발생했습니다."
        });
    }
});

// AI 문제 생성
app.post("/generate", async (req, res) => {
    const studyText = String(req.body?.studyText || "").trim();
    const level = String(req.body?.level || "보통");
    const count = Math.min(Math.max(Number(req.body?.count) || 5, 1), 20);
    const type = String(req.body?.type || "객관식");
    const username = String(req.body?.username || "").trim();

    if (!studyText) {
        return res.status(400).json({
            error: "학습 내용을 입력해주세요."
        });
    }

    if (studyText.length > 30000) {
        return res.status(400).json({
            error: "학습 내용이 너무 깁니다. 30,000자 이하로 입력해주세요."
        });
    }

    // API 키는 응답이나 브라우저에 절대 보내지 않습니다.
    const apiKey = String(process.env.GEMINI_API_KEY || "").trim();

    if (!apiKey) {
        console.error("GEMINI_API_KEY가 설정되어 있지 않습니다.");

        return res.status(500).json({
            error:
                "서버에 GEMINI_API_KEY가 설정되어 있지 않습니다. server.js와 같은 폴더의 .env 파일을 확인한 뒤 서버를 다시 시작해주세요."
        });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
           model: "gemini-3.8-flash"
        });

        let typeRule;

        if (type === "OX 퀴즈") {
            typeRule = "각 문제는 O 또는 X로 답할 수 있도록 만들어라.";
        } else if (type === "주관식") {
            typeRule = "각 문제는 주관식으로 만들어라.";
        } else {
            typeRule = `
각 문제는 4지선다 객관식으로 만들어라.
선택지는 ①, ②, ③, ④ 형식을 사용하라.`;
        }

        const prompt = `
너는 한국 고등학생을 위한 AI 문제 출제자다.
아래 학습 내용을 바탕으로 ${count}개의 문제를 만들어라.

난이도: ${level}
문제 유형: ${type}

${typeRule}

반드시 아래 형식을 지켜라.

[문제]
문제 1
문제 내용

문제 2
문제 내용

[정답]
1번: 정답
2번: 정답

학습 내용:
${studyText}
`;

        const result = await model.generateContent(prompt);
        const generatedText = result.response.text().trim();
        const parts = generatedText.split(/\[정답\]/i);

        const questions = (parts[0] || "")
            .replace(/\[문제\]/i, "")
            .trim();

        const answers = parts.slice(1).join("[정답]").trim();

        if (!questions) {
            throw new Error("Gemini가 문제 내용을 반환하지 않았습니다.");
        }

        // 로그인한 사용자만 자동으로 기록을 저장합니다.
        if (username) {
            const users = loadUsers();

            saveHistoryForUser(users, username, {
                id: crypto.randomUUID(),
                studyText,
                level,
                count,
                type,
                questions,
                answers: answers || "정답을 불러오지 못했습니다.",
                createdAt: new Date().toISOString()
            });
        }

        res.json({
            success: true,
            questions,
            answers: answers || "정답을 불러오지 못했습니다."
        });
    } catch (error) {
        // 서버 콘솔에는 진단용 오류를 남기되 API 키는 출력하지 않습니다.
        console.error("AI 문제 생성 오류:", error.message);

        const safeError = getGeminiError(error);

        res.status(safeError.status).json({
            error: safeError.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`AI 문제 생성기 서버 실행: http://localhost:${PORT}`);
    console.log(
        `GEMINI_API_KEY 설정 여부: ${Boolean(
            String(process.env.GEMINI_API_KEY || "").trim()
        )}`
    );
});
