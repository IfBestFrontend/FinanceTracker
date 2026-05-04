// Глобальные переменные и константы

const UI_TEXT = {
    // Для add-edit-transaction
    transaction_editTitle: "Редактирование транзакции",
    transaction_addTitle: "Новая транзакция",
    transaction_saveBtn: "Сохранить",
    transaction_addBtn: "Добавить",

    // Для nnn
};

const actions = {
    "close-dialog": (e) => СloseDialog(e),
    "open-edit-transaction": (id) => OpenEditTransaction(id),
    "delete-transaction": (id) => DeleteTransactions(id),
    "toggle-theme": () => ToggleTheme(),
};

// let modal = getQwe

const LOCALSTORAGE_KEY = {
    transactions: "transactions",
    categories: "categories",
};

const TRANSACTION = {
    ID: "id",
    TYPE: "type", // Только 'expense' или 'income'

    SUMM: "summ", // Только положительное
    CATEGORY: "category", // может быть пустым
    DATE: "date", // хранится в миллисикундах (количество миллисекунд, прошедших с 1 января 1970 года 00:00:00 по UTC до указанной даты)
    COMMENT: "comment", // Любой длинны (пока всёравно)
};

const CATEGORY = {
    ID: "id",
    NAME: "name",
    HEX: "hex", // #rrggbb
};

// Было: ALL_TRANSACTION_LIST
let transactions = [];

//Было: FILTERED_TRANSACTION_LIST
let filteredTransactions = [];

// Было: BASE_CATEGORY_LIST
const BASE_CATEGORIES = [
    { [CATEGORY.ID]: 1, [CATEGORY.NAME]: "Еда", [CATEGORY.HEX]: "#1FDD00" },
    { [CATEGORY.ID]: 2, [CATEGORY.NAME]: "Транспорт", [CATEGORY.HEX]: "#6AB4FF" },
    { [CATEGORY.ID]: 3, [CATEGORY.NAME]: "Зарплата", [CATEGORY.HEX]: "#FFA100" },
    { [CATEGORY.ID]: 4, [CATEGORY.NAME]: "Развлечения", [CATEGORY.HEX]: "#FFF500" },
    { [CATEGORY.ID]: 5, [CATEGORY.NAME]: "Жильё", [CATEGORY.HEX]: "#976AFF" },
];

// Было: ALL_CATEGORY_LIST
let categories = [];

// Было: ??? (+ исправлена кирилица)
let filteredCategories = [];

let g_currentOutputTransaction = 0;
let g_maxOutputTransaction = 0;

//основные вспомогательные функции

function CreateAutoID(list) {
    if (!list || !Array.isArray(list)) {
        throw new Error(`CreateAutoID: ожидается массив, получено: ${list}`);
    }

    if (list.length === 0) {
        return 1;
    }

    const maxId = list.reduce((max, item) => {
        const id = typeof item.id === "number" ? item.id : 0;
        return Math.max(max, id);
    }, 0);

    return maxId + 1;
}

function CreateTransactionID() {
    return CreateAutoID(transactions);
}

function CreateCategoryID() {
    return CreateAutoID(categories);
}

function CollectTransactionObject(type, summ, category, date, comment, id = null) {
    if (!type || (type !== "income" && type !== "expense")) {
        throw new Error(
            `CollectTransactionObject: type должен быть "income" или "expense" (${type})`
        );
    }
    if (typeof summ !== "number" || summ < 0) {
        throw new Error(
            `CollectTransactionObject: summ должен быть неотрицательным числом (${summ})`
        );
    }
    if (type === "income" && category !== 0) {
        throw new Error(
            `CollectTransactionObject: для income невозможно значение категории, отлчное от 0 (${category})`
        );
    }
    //Дописать проверку корректности категории

    const dateObj = new Date(date);
    if (Number.isNaN(dateObj.getTime())) {
        throw new Error(`CollectTransactionObject: некорректная дата (${date})`);
    }

    const finalId = id !== null ? id : CreateTransactionID();
    // Проверка для category
    return {
        [TRANSACTION.ID]: finalId,
        [TRANSACTION.TYPE]: type,
        [TRANSACTION.SUMM]: summ,
        [TRANSACTION.CATEGORY]: category ?? "",
        [TRANSACTION.DATE]: dateObj.getTime(),
        [TRANSACTION.COMMENT]: comment ?? "",
    };
}

function CollectCategoryObject(name, hex, id = null) {
    if (typeof name !== "string" || name.trim() === "") {
        throw new Error(`CollectCategoryObject: name должен быть непустой строкой (${name})`);
    }
    if (typeof hex !== "string" || !/^#([0-9A-F]{6})$/i.test(hex)) {
        throw new Error(`CollectCategoryObject: hex должен быть в формате #RRGGBB (${hex})`);
    }

    const finalId = id !== null ? id : CreateCategoryID();

    return {
        [CATEGORY.ID]: finalId,
        [CATEGORY.NAME]: name,
        [CATEGORY.HEX]: hex,
    };
}

// function GetCategoryName (id) {
// }

function CreateDemoTransaction() {
    AddTransaction("income", 50000, 0, new Date("2026-01-11"), "Аванс");
    AddTransaction("income", 30000, 0, new Date("2026-01-12"), "Основная зарплата");
    AddTransaction("expense", 3500, 1, new Date("2026-01-13"), "Продукты");
    AddTransaction("expense", 1200, 1, new Date("2026-01-14"), "Такси");
    AddTransaction("expense", 2500, 1, new Date("2026-01-15"), "Кино");
}
// Было: LoadAllTransactionList
function LoadTransactions() {
    transactions = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY.transactions) || "[]");
    console.log(`LoadTransactions: Выполнено. Записано: ${transactions.length} `);
}

function LoadCategories() {
    categories = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY.categories) || "[]");
    console.log(`LoadCategories: Выполнено. Записано: ${categories.length} `);
}

function UpdateLocalStorageTransactions() {
    localStorage.setItem(LOCALSTORAGE_KEY.transactions, JSON.stringify(transactions));
    console.log(`UpdateLocalStorageTransactions: выполнено`);
}
function UpdateLocalStorageCategories() {
    localStorage.setItem(LOCALSTORAGE_KEY.categories, JSON.stringify(categories));
    console.log(`UpdateLocalStorageCategories: выполнено`);
}

function CreateBaseCategory() {
    localStorage.setItem(LOCALSTORAGE_KEY.categories, JSON.stringify(BASE_CATEGORIES));
    categories = BASE_CATEGORIES;
    console.log(`CreateBaseCategory: выполнено`);
}

function CheckBaseCategory() {
    // !!!
}

function СloseDialog(e) {}

function OpenEditTransaction(){

}

//Основные функции

function ShowMoreTransactions() {}

function AddTransaction(type, summ, category, date, comment) {
    transactions.push(CollectTransactionObject(type, summ, category, date, comment));
    // Конец функции:
    UpdateLocalStorageTransactions();
}

function EditTransaction(id, type, summ, category, date, comment) {
    // !!!

    // !!!
    // Конец функции:
    UpdateLocalStorageTransactions();
}

function DeleteTransactions(id) {

}

function AddCategory(name, hex) {
    categories.push(CollectCategoryObject(name, hex));
    // Конец функции:
    UpdateLocalStorageTransactions();
}

//Отрисовка и сабы отрисовки (до сортировки)
//

function CreateExpenseList(list) {}

function RenderExpenseChart() {
    const EXPENSE_LIST = CreateExpenseList(filteredTransactions);
}

function CreateNDayTransactionList(day) {}

function RenderBalanceChart(day) {
    // было: N_DAY_TRANSACTION_LIST
    let nDaysTransaction = CreateNDayTransactionList(day);
}

//Отладка
function StateLog() {
    console.log(`StateLog: проверка актиальных данных.`);
    console.log(`LOCALSTORAGE_KEY:`, LOCALSTORAGE_KEY);
    console.log(`categories: `, categories);
    console.log(`transactions: `, transactions);
    console.log(`BASE_CATEGORIES: `, BASE_CATEGORIES);
    console.log(`--- Актуальные для отладки значения закончились ---`);
}

// ---------ОСНОВНОЙ КОД----------
const IS_DEBUG = false;

document.addEventListener("DOMContentLoaded", () => {
    console.log("Испольнение кода загрузки окна");
    console.log(`IS_DEBUG: ${IS_DEBUG}`);

    if (IS_DEBUG) {
        localStorage.clear();
        console.log(`localStorage был очищен`);
    }

    if (localStorage.getItem(LOCALSTORAGE_KEY.categories) == null) {
        CreateBaseCategory();
        console.log("Категории были созданы /заного созданы");
    }

    if (localStorage.getItem(LOCALSTORAGE_KEY.transactions) == null) {
        console.log(localStorage.getItem(LOCALSTORAGE_KEY.transactions) == null);
        CreateDemoTransaction();
        console.log("Транзакции были созданы /заного созданы");
    }

    // CreateDemoTransaction();
    LoadCategories();
    LoadTransactions();
    filteredTransactions = transactions;

    StateLog();
});
