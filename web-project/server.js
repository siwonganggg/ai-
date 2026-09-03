const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const PORT = 3000;

// ========================================
// 기본 설정
// ========================================

app.use(cors());
app.use(express.json());

// 현재 server.js가 있는 폴더
const ROOT = __dirname;

// HTML / CSS / JS 제공
app.use(express.static(ROOT));


// ========================================
// 데이터 파일
// ========================================

const DATA_FILE = path.join(ROOT, "users.json");


// users.json이 없으면 자동 생성
function loadUsers() {

    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify([], null, 2),
            "utf8"
        );
    }

    try {

        const data =
            fs.readFileSync(DATA_FILE, "utf8");

        return JSON.parse(data);

    } catch (error) {

        console.error("users.json 읽기 오류:", error);

        return [];
    }
}


function saveUsers(users) {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(users, null, 2),
        "utf8"
    );
}


// ========================================
// 비밀번호 암호화
// ========================================

function hashPassword(password) {

    const salt =
        crypto.randomBytes(16).toString("hex");

    const hash =
        crypto
            .scryptSync(password, salt, 64)
            .toString("hex");

    return `${salt}:${hash}`;
}


function verifyPassword(password, storedPassword) {

    try {

        const [salt, storedHash] =
            storedPassword.split(":");

        const hash =
            crypto
                .scryptSync(password, salt, 64)
                .toString("hex");

        return crypto.timingSafeEqual(
            Buffer.from(hash, "hex"),
            Buffer.from(storedHash, "hex")
        );

    } catch {

        return false;
    }
}


// ========================================
// 회원가입
// ========================================

app.post("/api/signup", (req, res) => {

    try {

        const {
            username,
            password
        } = req.body;


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


        const existingUser =
            users.find(
                user => user.username === username
            );


        if (existingUser) {

            return res.status(409).json({
                error: "이미 존재하는 아이디입니다."
            });

        }


        const newUser = {

            id: crypto.randomUUID(),

            username: username,

            password: hashPassword(password),

            history: [],

            createdAt: new Date().toISOString()

        };


        users.push(newUser);

        saveUsers(users);


        console.log(
            `회원가입 완료: ${username}`
        );


        res.json({

            success: true,

            message: "회원가입이 완료되었습니다."

        });


    } catch (error) {

        console.error(
            "회원가입 오류:",
            error
        );

        res.status(500).json({

            error:
                "회원가입 처리 중 서버 오류가 발생했습니다."

        });

    }

});


// ========================================
// 로그인
// ========================================

app.post("/api/login", (req, res) => {

    try {

        const {
            username,
            password
        } = req.body;


        const users = loadUsers();


        const user =
            users.find(
                user => user.username === username
            );


        if (!user) {

            return res.status(401).json({
                error: "아이디 또는 비밀번호가 틀렸습니다."
            });

        }


        const passwordCorrect =
            verifyPassword(
                password,
                user.password
            );


        if (!passwordCorrect) {

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

        console.error(
            "로그인 오류:",
            error
        );

        res.status(500).json({

            error: "로그인 처리 중 서버 오류가 발생했습니다."

        });

    }

});


// ========================================
// 문제 기록 저장
// ========================================

app.post("/api/history", (req, res) => {

    try {

        const {
            username,
            studyText,
            level,
            count,
            type,
            questions,
            answers
        } = req.body;


        if (!username) {

            return res.status(400).json({
                error: "로그인이 필요합니다."
            });

        }


        const users = loadUsers();


        const user =
            users.find(
                user => user.username === username
            );


        if (!user) {

            return res.status(404).json({
                error: "사용자를 찾을 수 없습니다."
            });

        }


        const history = {

            id: crypto.randomUUID(),

            studyText: studyText || "",

            level: level || "보통",

            count: count || 5,

            type: type || "객관식",

            questions: questions || "",

            answers: answers || "",

            createdAt: new Date().toISOString()

        };


        user.history.unshift(history);


        saveUsers(users);


        res.json({

            success: true,

            message: "문제 기록이 저장되었습니다.",

            history

        });


    } catch (error) {

        console.error(
            "기록 저장 오류:",
            error
        );

        res.status(500).json({

            error: "기록 저장 중 서버 오류가 발생했습니다."

        });

    }

});


// ========================================
// 문제 기록 가져오기
// ========================================

app.get("/api/history/:username", (req, res) => {

    try {

        const username =
            req.params.username;


        const users = loadUsers();


        const user =
            users.find(
                user => user.username === username
            );


        if (!user) {

            return res.status(404).json({
                error: "사용자를 찾을 수 없습니다."
            });

        }


        res.json({

            success: true,

            history: user.history || []

        });


    } catch (error) {

        console.error(
            "기록 조회 오류:",
            error
        );

        res.status(500).json({

            error: "기록 조회 중 서버 오류가 발생했습니다."

        });

    }

});


// ========================================
// 기록 삭제
// ========================================

app.delete(
    "/api/history/:username/:historyId",
    (req, res) => {

        try {

            const {
                username,
                historyId
            } = req.params;


            const users = loadUsers();


            const user =
                users.find(
                    user => user.username === username
                );


            if (!user) {

                return res.status(404).json({
                    error: "사용자를 찾을 수 없습니다."
                });

            }


            user.history =
                user.history.filter(
                    item => item.id !== historyId
                );


            saveUsers(users);


            res.json({

                success: true,

                message: "기록이 삭제되었습니다."

            });


        } catch (error) {

            console.error(
                "기록 삭제 오류:",
                error
            );

            res.status(500).json({

                error: "기록 삭제 중 서버 오류가 발생했습니다."

            });

        }

    }
);


// ========================================
// Gemini
// ========================================

const genAI =
    new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY
    );


// ========================================
// AI 문제 생성
// ========================================

app.post("/generate", async (req, res) => {

    try {

        const {
            studyText,
            level,
            count,
            type,
            username
        } = req.body;


        if (!studyText) {

            return res.status(400).json({

                error: "학습 내용을 입력해주세요."

            });

        }


        const model =
            genAI.getGenerativeModel({

                model: "gemini-2.5-flash"

            });


        let typeRule = "";


        if (type === "OX 퀴즈") {

            typeRule = `
각 문제는 O 또는 X로 답할 수 있도록 만들어라.
`;

        } else if (type === "주관식") {

            typeRule = `
각 문제는 주관식으로 만들어라.
`;

        } else {

            typeRule = `
각 문제는 4지선다 객관식으로 만들어라.

①
②
③
④
`;

        }


        const prompt = `

너는 한국 고등학생을 위한 AI 문제 출제자다.

다음 학습 내용을 바탕으로 문제를 만들어라.

난이도: ${level}
문제 개수: ${count}
문제 유형: ${type}

${typeRule}

반드시 문제와 정답을 분리해서 출력한다.

출력 형식:

[문제]

문제 1
문제 내용

문제 2
문제 내용

...

[정답]

1번: 정답
2번: 정답
...

학습 내용:
${studyText}

`;


        const result =
            await model.generateContent(prompt);


        const response =
            await result.response;


        const text =
            response.text();


        const parts =
            text.split("[정답]");


        const questions =
            parts[0]
                .replace("[문제]", "")
                .trim();


        const answers =
            parts[1]
                ? parts[1].trim()
                : "정답을 불러오지 못했습니다.";


        // ====================================
        // 로그인한 사용자의 기록 저장
        // ====================================

        if (username) {

            const users = loadUsers();


            const user =
                users.find(
                    user => user.username === username
                );


            if (user) {

                user.history.unshift({

                    id: crypto.randomUUID(),

                    studyText,

                    level,

                    count,

                    type,

                    questions,

                    answers,

                    createdAt:
                        new Date().toISOString()

                });


                saveUsers(users);

            }

        }


        res.json({

            success: true,

            questions,

            answers

        });


    } catch (error) {

        console.error(
            "AI 문제 생성 오류:",
            error
        );


        res.status(500).json({

            error:
                error.message ||
                "AI 문제 생성에 실패했습니다."

        });

    }

});


// ========================================
// 서버 실행
// ========================================

app.listen(PORT, () => {

    console.log("");
    console.log("================================");
    console.log(" AI 문제 생성기 서버 실행");
    console.log("================================");
    console.log(
        `http://localhost:${PORT}`
    );
    console.log("================================");
    console.log("");

});
