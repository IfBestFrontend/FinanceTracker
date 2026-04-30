// eslint.config.js
module.exports = [
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script", // или "module", если у тебя <script type="module">
            globals: {
                // Браузерные API
                window: "readonly",
                document: "readonly",
                localStorage: "readonly",
                sessionStorage: "readonly",
                console: "readonly",
                alert: "readonly",
                confirm: "readonly",
                prompt: "readonly",
                setTimeout: "readonly",
                setInterval: "readonly",
                fetch: "readonly",
                // Глобальные переменные твоего проекта (если нужно)
                // ALL_TRANSACTION_LIST: "writable",
                // ALL_CATEGORY_LIST: "writable"
            },
        },
        rules: {
            eqeqeq: "warn", // ⚠️ == --> ===
            "no-undef": "warn", // ⚠️ Необъявленные переменные (например, ret)
            "no-redeclare": "error", // 🔴 Повторное объявление функций/переменных
            "no-unused-vars": "warn", // ⚠️ Неиспользуемые переменные (let i, etc.)
            "prefer-const": "warn", // ⚠️ let, который можно заменить на const
            "no-implicit-coercion": "warn", // ⚠️ Неявное приведение типов
        },
    },
];
