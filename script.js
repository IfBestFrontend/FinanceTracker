// Глобальные переменные и константы

const UI_TEXT = {
    // Для add-edit-transaction
    transaction_editTitle: "Редактирование транзакции",
    transaction_addTitle: "Новая транзакция",
    transaction_saveBtn: "Сохранить",

    // Для nnn
};

const addEditTransactionDialog = document.getElementById("add-edit-transaction");
const addEditTransactionForm = document.getElementById("add-edit-form");

const action = {
    "close-dialog": (ctx) => CloseDialog(ctx.e),
    "open-edit-transaction": (ctx) => OpenEditTransaction(ctx),
    "open-add-transaction": () => OpenAddTransaction(),
    "delete-transaction": (ctx) => {
        if (confirm("Вы подтверждаете удаление транзакции? Ваше действие будет необратимо"))
            DeleteTransactions(ctx.id);
    },
    "toggle-theme": () => ToggleTheme(),
    "show-more": () => ShowMoreTransactions(),
    "open-settings": () => OpenSettings(),
    "exclude-category": () => ExcludeCategory(),
    "delete-category": () => DeleteCategory(),
    "show-comment": (ctx) => ToggleComment(ctx.id),
    "save-transaction": (ctx) => {
        SaveTransaction(ctx.id);
        CloseDialog(ctx.e);
    },
    "export-data": () => ExportData(),
    "import-data": () => {},
    // "edit-transaction": () => EditTransaction(),
    // "add-transaction": () => AddTransaction(),
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
    COMMENT: "comment", // Любой длинны (пока всё равно)
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

const defaultFilter = {
    ordering: true,
    "type-sort": "date",
    "type-transaction": "all",
    categories: [],
    "start-date": null,
    "end-date": null,
    comment: "",
};
let filter = {};

// Было: BASE_CATEGORY_LIST
const BASE_CATEGORIES = [
    { [CATEGORY.ID]: 1, [CATEGORY.NAME]: "Еда", [CATEGORY.HEX]: "#1FDD00" },
    { [CATEGORY.ID]: 2, [CATEGORY.NAME]: "Транспорт", [CATEGORY.HEX]: "#6AB4FF" },
    { [CATEGORY.ID]: 3, [CATEGORY.NAME]: "Здоровье", [CATEGORY.HEX]: "#FFF500" },
    { [CATEGORY.ID]: 4, [CATEGORY.NAME]: "Развлечения", [CATEGORY.HEX]: "#FFA100" },
    { [CATEGORY.ID]: 5, [CATEGORY.NAME]: "Жильё", [CATEGORY.HEX]: "#976AFF" },
];

// Было: ALL_CATEGORY_LIST
let categories = [];

// Было: ??? (+ исправлена кирилица)
let filteredCategories = [];

let g_currentOutputTransaction = 0;
const TRANSACTIONS_BATCH_SIZE = 5;
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

const daysForDemo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
};

function CreateDemoTransaction() {
    AddTransaction("income", 45000, 0, daysForDemo(0), "Зарплата");
    AddTransaction("expense", 3500, 1, daysForDemo(1), "Продукты");
    AddTransaction("expense", 1200, 1, daysForDemo(2), "");
    AddTransaction("expense", 2500, 4, daysForDemo(3), "Кино");
    AddTransaction("income", 2000, 0, daysForDemo(4), "От мамы на вкусняшки");
    AddTransaction("income", 2500, 0, daysForDemo(5), "Вернули долг");
    AddTransaction("expense", 5000, 4, daysForDemo(5), "");
    AddTransaction("expense", 5800, 2, daysForDemo(5), "Покупка проездного на месяц");
    AddTransaction("income", 358, 0, daysForDemo(6), "Кешбек");
    AddTransaction("expense", 2500, 3, daysForDemo(6), "Аренда");
    AddTransaction("expense", 1280, 3, daysForDemo(7), "");
    AddTransaction("income", 12000, 0, daysForDemo(7), "Аванс");
    AddTransaction("expense", 8900, 5, daysForDemo(7), "Комунальные услуги");
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

function CloseDialog(target) {
    let dialog = null;

    if (target instanceof Event) {
        dialog = target.target.closest("dialog");
    } else if (typeof target === "string") {
        dialog = document.querySelector(target);
    } else if (target instanceof HTMLElement) {
        dialog = target.tagName === "DIALOG" ? target : target.closest("dialog");
    }

    if (!dialog) {
        console.warn("⚠️ Диалог не найден");
        return;
    }

    const form = dialog.querySelector("form");
    if (form) form.reset();

    dialog.close();
}

function OpenSettings() {
    const dialog = document.getElementById("settings");
    if (dialog) dialog.showModal();
}
function OpenEditTransaction(ctx) {
    if (!ctx.id) {
        console.error("Нет data-id для редактирования");
        return;
    }
    const tx = transactions.find((t) => t[TRANSACTION.ID] == ctx.id);
    if (!tx) {
        console.error(`Транзакция с id=${ctx.id} не найдена`);
        return;
    }

    addEditTransactionForm.dataset.id = ctx.id;
    addEditTransactionDialog.querySelector("[data-modal-title]").textContent =
        UI_TEXT.transaction_editTitle;

    Object.entries(tx).forEach(([key, value]) => {
        const el = addEditTransactionForm.elements[key];
        if (!el) return;

        if (key === "date") {
            el.valueAsDate = value ? new Date(value) : null;
        } else {
            el.value = value;
        }
    });

    addEditTransactionDialog.showModal();
    UpdateCategorySelectState();
}

function OpenAddTransaction() {
    addEditTransactionForm.reset();
    delete addEditTransactionForm.dataset.id;
    addEditTransactionDialog.querySelector("[data-modal-title]").textContent =
        UI_TEXT.transaction_addTitle;
    addEditTransactionDialog.showModal();
    UpdateCategorySelectState();
}

function SaveTransaction(id = null) {
    console.log(`Вызов SaveTransaction`);
    const transactionsListEl = document.getElementById("transactions-list");
    const trValues = GetTransactionFormValues();
    if (id === null || id === "") {
        const tr = AddTransaction(
            trValues.type,
            trValues.summ,
            trValues.category,
            trValues.date,
            trValues.comment
        );
        console.log(`Вызов AddTransaction, добавлено: `, tr);
        if (isTransactionMatchFilter(tr)) {
            SubFilteringFuntions(); //А можно усложнить логику, но пока - дедлайн
        }
    } else {
        const tr = EditTransaction(
            id,
            trValues.type,
            trValues.summ,
            trValues.category,
            trValues.date,
            trValues.comment
        );
        console.log(`Вызов EditTransaction, объект изменения: `, tr);

        const transactionEl = transactionsListEl.querySelector(`[data-id="${tr.id}"]`);
        transactionsListEl.replaceChild(FillTransactionCard(tr), transactionEl);
    }
}

function CreateOptionsToFormTransactionCategory(selectId = "form-transaction-category") {
    const select = document.getElementById(selectId);
    if (!select) return;

    const selectedValue = select.value;

    select.innerHTML = "<option disabled selected>Выберите категорию</option>";

    categories.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat[CATEGORY.ID];
        option.textContent = cat[CATEGORY.NAME];
        select.appendChild(option);
    });

    if (selectedValue && Array.from(select.options).some((opt) => opt.value == selectedValue)) {
        select.value = selectedValue;
    }
}

function FillTransactionCard(tr) {
    const template = document.getElementById("transaction");
    const clone = template.content.cloneNode(true);

    const div = clone.querySelector(".transaction");
    if (!div) return;

    div.dataset.id = tr[TRANSACTION.ID];

    // dot
    const dot = clone.querySelector(".transaction__dot");
    if (dot) {
        const dotColor = tr[TRANSACTION.TYPE] === "expense" ? "#ff3b3b" : "#4ea3ff";
        dot.style.setProperty("--dot-color", dotColor);
    }

    // amount
    const amountEl = clone.querySelector(".transaction__amount");
    if (amountEl) {
        const sign = tr[TRANSACTION.TYPE] === "income" ? "+" : "-";
        amountEl.textContent = `${sign} ${tr[TRANSACTION.SUMM].toFixed(2)} ₽`;
    }

    // category
    const catEl = clone.querySelector(".transaction__category");
    if (catEl) {
        if (tr[TRANSACTION.TYPE] === "expense" && tr[TRANSACTION.CATEGORY]) {
            const cat = categories.find((c) => c[CATEGORY.ID] === tr[TRANSACTION.CATEGORY]);
            catEl.textContent = cat ? cat[CATEGORY.NAME] : "";
            catEl.style.display = "";
        } else {
            catEl.style.display = "none";
        }
    }

    // date
    const dateEl = clone.querySelector(".transaction__date");
    if (dateEl) {
        dateEl.textContent = new Date(tr[TRANSACTION.DATE]).toLocaleDateString("ru-RU");
    }

    // note
    const noteEl = clone.querySelector(".transaction__note");
    const moreBtn = clone.querySelector(".transaction__more");

    if (noteEl) {
        if (tr[TRANSACTION.COMMENT] && tr[TRANSACTION.COMMENT].trim() !== "") {
            noteEl.textContent = tr[TRANSACTION.COMMENT];
            noteEl.style.display = "none";
            if (moreBtn) {
                moreBtn.style.display = "";
                const img = moreBtn.querySelector("img");
                if (img) img.style.transform = "";
            }
        } else {
            noteEl.textContent = "";
            noteEl.style.display = "none";
            if (moreBtn) moreBtn.style.display = "none";
        }
    }

    // divider - скрыть для доходов
    const dividerEl = clone.querySelector(".transaction__divider");
    if (dividerEl) {
        if (tr[TRANSACTION.TYPE] === "income") {
            dividerEl.style.display = "none";
        } else {
            dividerEl.style.display = "inline-block";
        }
    }
    return clone;
}

function FillCategoryLegendItem(id) {
    const template = document.getElementById("category-legend-item");
    if (!template) return null;

    const clone = template.content.cloneNode(true);
    const container = clone.querySelector(".category-item");
    if (!container) return null;

    container.dataset.id = id;

    const category = categories.find((cat) => cat[CATEGORY.ID] === id);
    if (!category) return null;

    const nameSpan = container.querySelector('[data-field="category-name"]');
    if (nameSpan) nameSpan.textContent = category[CATEGORY.NAME];

    const hexSpan = container.querySelector('[data-field="category-hex"]');
    if (hexSpan) hexSpan.style.backgroundColor = category[CATEGORY.HEX] || "#CCCCCC";

    return clone;
}

function getContrastColor(hex) {
    hex = hex.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const brightness = (r + g + b) / 3;
    return brightness >= 128 ? "#000000" : "#FFFFFF";
}

function FillCategoryItem(id, isDeleteMode = false) {
    const template = document.getElementById("category-item");
    if (!template) return null;

    const clone = template.content.cloneNode(true);
    const container = clone.querySelector(".category-item");
    if (!container) return null;
    container.dataset.id = id;

    const category = categories.find((cat) => cat[CATEGORY.ID] === id);
    if (!category) return null;

    const nameSpan = container.querySelector('[data-field="category-name"]');
    if (nameSpan) nameSpan.textContent = category[CATEGORY.NAME];

    const bgColor = category[CATEGORY.HEX] || "#CCCCCC";
    container.style.backgroundColor = bgColor;
    container.style.color = getContrastColor(bgColor);

    const button = container.querySelector("button");
    if (button) {
        const isBase = id >= 1 && id <= 5;
        if (isDeleteMode) {
            if (isBase) {
                button.remove();
            } else {
                button.dataset.action = "delete-category";
            }
        } else {
            button.dataset.action = "exclude-category";
        }
    }

    return clone;
}

//Основные функции
function ShowMoreTransactions(count) {
    if (g_currentOutputTransaction >= filteredTransactions.length) {
        const btn = document.getElementById("show-more");
        if (btn) btn.style.display = "none";
        console.warn("ShowMoreTransactions: все транзакции уже показаны");
        return;
    }

    const remaining = filteredTransactions.length - g_currentOutputTransaction;
    const toShow = Math.min(count, remaining);
    if (toShow <= 0) return;

    const container = document.querySelector(".transaction-list");
    if (!container) {
        console.error("Контейнер");
        return;
    }

    filteredTransactions
        .slice(g_currentOutputTransaction, g_currentOutputTransaction + toShow)
        .forEach((trId) => {
            const tr = transactions.find((t) => t[TRANSACTION.ID] === trId);
            if (!tr) {
                console.warn("Внимание! обнаружена несуществующая транзакция, невозможная ошибка");
                return;
            }
            const clone = FillTransactionCard(tr);
            container.appendChild(clone);
        });

    g_currentOutputTransaction += toShow;
    const showMoreBtn = document.getElementById("show-more");
    if (showMoreBtn) {
        showMoreBtn.style.display =
            g_currentOutputTransaction >= filteredTransactions.length ? "none" : "block";
    }
}

function ToggleComment(transactionId) {
    const transaction = document.querySelector(`.transaction[data-id="${transactionId}"]`);
    if (!transaction) return;

    const note = transaction.querySelector(".transaction__note");
    const button = transaction.querySelector(".transaction__more");
    if (!note || !note.textContent.trim()) return;

    if (note.style.display === "none" || note.style.display === "") {
        note.style.display = "block";
    } else {
        note.style.display = "none";
    }

    if (button) {
        const img = button.querySelector("img");
        if (img) {
            img.style.transform = note.style.display === "block" ? "rotate(180deg)" : "";
        }
    }
}

function isTransactionMatchFilter(tr) {
    const typeTransaction = filter["type-transaction"];
    const categories = filter["categories"];
    const startDate = filter["start-date"];
    const endDate = filter["end-date"];
    const comment = filter["comment"];

    if (typeTransaction !== "all" && tr[TRANSACTION.TYPE] !== typeTransaction) {
        console.log("typeTransaction false, typeTransaction:", typeTransaction, " tr: ", tr);
        return false;
    }

    if (
        (tr[TRANSACTION.TYPE] === "expense" || tr[TRANSACTION.TYPE] === "all") &&
        categories.length > 0 &&
        !categories.includes(tr[TRANSACTION.CATEGORY])
    ) {
        console.log("typeTransaction false, categories:", categories, " tr: ", tr);

        return false;
    }

    const trDate = tr[TRANSACTION.DATE];
    if (startDate !== null && trDate < startDate) {
        console.log("startDate false, tr: ", tr);
        return false;
    }
    if (endDate !== null && trDate > endDate) {
        console.log("endDate false, tr: ", tr);
        return false;
    }

    if (comment && comment.trim()) {
        const trComment = String(tr[TRANSACTION.COMMENT] || "").toLowerCase();
        if (!trComment.includes(comment.toLowerCase())) {
            console.log("trComment false, tr: ", tr);
            return false;
        }
    }

    console.log("filter true, tr: ", tr);
    return true;
}

function Filtering() {
    const ordering = filter["ordering"];
    const typeSort = filter["type-sort"];

    const categoryNameCache = new Map();
    if (typeSort === "abc") {
        (window.categories || []).forEach((cat) => {
            categoryNameCache.set(cat[CATEGORY.ID], cat[CATEGORY.NAME].toLowerCase());
        });
    }

    const filtered = transactions.filter((tr) => isTransactionMatchFilter(tr));

    filtered.sort((a, b) => {
        let compareResult = 0;

        switch (typeSort) {
            case "summ":
                compareResult = a[TRANSACTION.SUMM] - b[TRANSACTION.SUMM];
                break;

            case "abc": {
                const getName = (tr) =>
                    tr[TRANSACTION.TYPE] === "expense"
                        ? categoryNameCache.get(tr[TRANSACTION.CATEGORY]) || ""
                        : "";

                compareResult = getName(a).localeCompare(getName(b));
                break;
            }

            case "date":
            default:
                compareResult = a[TRANSACTION.DATE] - b[TRANSACTION.DATE];
                break;
        }

        // ordering: true = asc (оставляем как есть), false = desc (инвертируем)
        return ordering ? compareResult : -compareResult;
    });

    filteredTransactions = filtered.map((tr) => tr[TRANSACTION.ID]);
}

// function Filtering() {
//     const ordering = document.querySelector('#ordering-sort')?.checked ?? false;
//     const typeSort = document.querySelector('#type-sort')?.value ?? 'date';
//     const typeTransaction = document.querySelector('#type-transaction-sort')?.value ?? 'all';
//     const startDateValue = document.querySelector('#start-date-filter')?.value || '';
//     const endDateValue = document.querySelector('#end-date-filter')?.value || '';
//     const commentFilter = (document.querySelector('.filter__search input[name="comment"]')?.value || '')
//         .trim()
//         .toLowerCase();
//     const startDate = startDateValue ? new Date(startDateValue).getTime() : null;
//     const endDate = endDateValue ? new Date(endDateValue).getTime() : null;
//     const selectedCategoryIds = [];
//     const tagElements = document.querySelectorAll(
//         '#filter-categories-list .tag'
//     );

//     tagElements.forEach((tag) => {
//         const tagText = tag.textContent.replace('×', '').trim();
//         const category = categories.find(
//             (cat) => cat[CATEGORY.NAME] === tagText
//         );

//         if (category) {
//             selectedCategoryIds.push(category[CATEGORY.ID]);
//         }
//     });

//     filteredTransactions = transactions.filter((tr) => {
//         // Тип транзакции
//         if (typeTransaction !== 'all' && tr[TRANSACTION.TYPE] !== typeTransaction) {
//             return false;
//         }

//         // Категории только для расходов
//         if (tr[TRANSACTION.TYPE] === 'expense' && selectedCategoryIds.length > 0 && !selectedCategoryIds.includes(tr[TRANSACTION.CATEGORY])) {
//             return false;
//         }

//         // Дата начала
//         if (startDate !== null && tr[TRANSACTION.DATE] < startDate) {
//             return false;
//         }

//         // Дата конца
//         if (endDate !== null && tr[TRANSACTION.DATE] > endDate) {
//             return false;
//         }

//         // Комментарий
//         const comment = String(tr[TRANSACTION.COMMENT] || '').toLowerCase();

//         if (commentFilter && !comment.includes(commentFilter)) {
//             return false;
//         }

//         return true;
//     });

//     filteredTransactions.sort((a, b) => {
//         let compareResult = 0;

//         switch (typeSort) {
//             case 'summ':
//                 compareResult =
//                     a[TRANSACTION.SUMM] -
//                     b[TRANSACTION.SUMM];
//                 break;

//             case 'abc': {
//                 const getCategoryName = (transaction) => {
//                     if (transaction[TRANSACTION.TYPE] !== 'expense') {
//                         return '';
//                     }
//                     const category = categories.find((cat) => cat[CATEGORY.ID] === transaction[TRANSACTION.CATEGORY]);
//                     return category
//                         ? category[CATEGORY.NAME].toLowerCase()
//                         : '';
//                 };

//                 compareResult = getCategoryName(a).localeCompare(
//                     getCategoryName(b)
//                 );
//                 break;
//             }

//             case 'date':
//             default: compareResult = a[TRANSACTION.DATE] - b[TRANSACTION.DATE];
//                 break;
//         }
//         return ordering ? compareResult : -compareResult;
//     });

//     g_currentOutputTransaction = 0;

//     if (g_currentOutputTransaction > filteredTransactions.length) {
//         g_currentOutputTransaction = filteredTransactions.length;
//     }

//     const transactionList = document.querySelector('.transaction-list');
//     if (transactionList) {
//         transactionList.innerHTML = '';
//     }

//     ShowMoreTransactions(TRANSACTIONS_BATCH_SIZE);

//     if (typeof UpdateStats === 'function') {
//         UpdateStats();
//     }
// }

function SubFilteringFuntions(transactionsListEl = document.getElementById("transactions-list")) {
    transactionsListEl.replaceChildren();
    Filtering();
    g_currentOutputTransaction = 0;
    ShowMoreTransactions(TRANSACTIONS_BATCH_SIZE);
    RenderBalanceChart();
}

function AddTransaction(type, summ, category, date, comment) {
    const tr = CollectTransactionObject(type, summ, category, date, comment);
    transactions.push(tr);
    // Конец функции:
    UpdateLocalStorageTransactions();
    return tr;
}

function EditTransaction(id, type, summ, category, date, comment) {
    // !!!
    const index = transactions.findIndex((element) => element.id === Number(id));
    const tr = CollectTransactionObject(type, summ, category, date, comment, id);
    transactions[index] = tr;
    console.log(id, index, transactions[index]);
    // !!!
    // Конец функции:
    UpdateLocalStorageTransactions();
    return tr;
}

function DeleteTransactions(id) {
    const numericId = Number(id);

    const index = transactions.findIndex((tx) => tx[TRANSACTION.ID] === numericId);
    if (index === -1) {
        console.warn(`DeleteTransactions: транзакция с id=${id} не найдена`);
        return;
    }
    transactions.splice(index, 1);

    UpdateLocalStorageTransactions();
    SubFilteringFuntions();
}

function AddCategory(name, hex) {
    categories.push(CollectCategoryObject(name, hex));
    UpdateLocalStorageCategories();
    CreateOptionsToFormTransactionCategory();
    CreateOptionsToFormTransactionCategory("category-sort");
    populateCategorySelect(); // обновляем выпадающий список фильтра
}

function GetTransactionFormValues() {
    try {
        const dialog = document.getElementById("add-edit-transaction");
        if (!dialog) throw new Error("GetFormValues: диалог не найден");

        const form = dialog.querySelector(".transaction-form");
        if (!form) throw new Error("GetFormValues: форма не найдена");

        const data = new FormData(form);

        const type = data.get("type");
        if (type !== "income" && type !== "expense") {
            throw new Error(`GetFormValues: некорректный type (${type})`);
        }
        const summRaw = data.get("summ");
        const summ = parseFloat(summRaw);
        if (isNaN(summ) || summ <= 0) {
            throw new Error(`GetFormValues: некорректная summ (${summRaw})`);
        }

        const categoryRaw = data.get("category");
        let category;
        if (categoryRaw === null || categoryRaw === "" || categoryRaw === "Выберите категорию") {
            category = 0;
        } else {
            const categoryId = Number(categoryRaw);
            if (!Number.isInteger(categoryId) || isNaN(categoryId)) {
                throw new Error(
                    `GetFormValues: category должен быть числовым id, получено (${categoryRaw})`
                );
            }
            category = categoryId;
        }

        const dateRaw = data.get("date");
        const dateObj = new Date(dateRaw);
        if (!dateRaw || isNaN(dateObj.getTime())) {
            throw new Error(`GetFormValues: некорректная date (${dateRaw})`);
        }

        const comment = data.get("comment") ?? "";

        return { type, summ, category, date: dateObj, comment };
    } catch (e) {
        console.error(e.message);
        return null;
    }
}

function ExportData() {}

//Отрисовка и сабы отрисовки (до сортировки)
//

function CreateExpenseList(list) {}

function RenderExpenseChart() {
    const EXPENSE_LIST = CreateExpenseList(filteredTransactions);
}

function CreateNDayTransactionList(day) {}

// function RenderBalanceChart(day) {
//     // было: N_DAY_TRANSACTION_LIST
//     let nDaysTransaction = CreateNDayTransactionList(day);
// }

// Переключение тёмной/светлой темы
function ToggleTheme() {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    const toggle = document.getElementById("dark-theme-toggle");
    if (toggle) toggle.checked = isDark;
}

// Инициализация темы из localStorage
(function initTheme() {
    const savedTheme = localStorage.getItem("theme");
    const toggle = document.getElementById("dark-theme-toggle");
    if (savedTheme === "light") {
        document.body.classList.remove("dark");
        if (toggle) toggle.checked = false;
    } else if (savedTheme === "dark") {
        document.body.classList.add("dark");
        if (toggle) toggle.checked = true;
    } else {
        const isDark = document.body.classList.contains("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        if (toggle) toggle.checked = isDark;
    }
})();

function DeleteCategory() {}

//Отладка
function StateLog() {
    console.log(`StateLog: проверка актиальных данных.`);
    console.log(`LOCALSTORAGE_KEY:`, LOCALSTORAGE_KEY);
    console.log(`categories: `, categories);
    console.log(`transactions: `, transactions);
    console.log(`BASE_CATEGORIES: `, BASE_CATEGORIES);
    console.log(`filteredTransactions: `, filteredTransactions);
    console.log(`g_currentOutputTransaction: `, g_currentOutputTransaction);
    console.log(`filter: `, filter);
    console.log(`--- Актуальные для отладки значения закончились ---`);
}

// ---------ОСНОВНОЙ КОД----------
const IS_DEBUG = true;

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

    let strD = new Date("2026-01-15");

    filter = {
        ...defaultFilter, // берём все дефолтные значения
        // "start-date": strD.getTime(), // аккуратно перезаписываем одно поле
    };

    LoadCategories();
    CreateOptionsToFormTransactionCategory();
    CreateOptionsToFormTransactionCategory("category-sort");
    LoadTransactions();

    filteredTransactions = [...transactions];
    g_currentOutputTransaction = 0;

    StateLog();
    Filtering();
    UpdateFilterCategoryState();
    RenderBalanceChart();
    ShowMoreTransactions(TRANSACTIONS_BATCH_SIZE);

    StateLog();
    const showMoreBtn = document.getElementById("show-more");
    if (showMoreBtn) {
        showMoreBtn.onclick = () => ShowMoreTransactions(TRANSACTIONS_BATCH_SIZE);
    }

    const themeToggle = document.getElementById("dark-theme-toggle");
    if (themeToggle) {
        themeToggle.addEventListener("change", ToggleTheme);
    }

    const typeRadios = document.querySelectorAll('input[name="type"]');
    typeRadios.forEach((radio) => {
        radio.addEventListener("change", UpdateCategorySelectState);
    });

    // function populateCategorySelect() {
    //     const categorySelect = document.getElementById('category-sort');
    //     if (!categorySelect) return;
    //     categorySelect.innerHTML = '<option selected disabled>Выбрать</option>';
    //     categories.forEach(cat => {
    //         if (cat[CATEGORY.ID] === 3) return;
    //         const option = document.createElement('option');
    //         option.value = cat[CATEGORY.ID];
    //         option.textContent = cat[CATEGORY.NAME];
    //         categorySelect.appendChild(option);
    //     });
    //     categorySelect.disabled = false;
    // }
    // populateCategorySelect();

    // const categorySelect = document.getElementById('category-sort');
    // if (categorySelect) {
    //     categorySelect.addEventListener('change', (e) => {
    //         const selectedId = parseInt(e.target.value);
    //         if (isNaN(selectedId)) return;
    //         const selectedCategory = categories.find(cat => cat[CATEGORY.ID] === selectedId);
    //         if (!selectedCategory) return;

    //         const existingTags = document.querySelectorAll('#filter-categories-list .tag');
    //         let alreadyExists = false;
    //         existingTags.forEach(tag => {
    //             const tagName = tag.textContent.replace('×', '').trim();
    //             if (tagName === selectedCategory[CATEGORY.NAME]) alreadyExists = true;
    //         });
    //         if (alreadyExists) {
    //             categorySelect.value = '';
    //             return;
    //         }

    //         const newTag = document.createElement('div');
    //         newTag.className = 'tag';
    //         const categoryName = selectedCategory[CATEGORY.NAME];
    //         switch (categoryName) {
    //             case 'Еда':
    //                 newTag.classList.add('tag--green');
    //                 break;
    //             case 'Транспорт':
    //                 newTag.classList.add('tag--blue');
    //                 break;
    //             case 'Развлечения':
    //                 newTag.classList.add('tag--orange');
    //                 break;
    //             case 'Здоровье':
    //                 newTag.classList.add('tag--yellow');
    //                 break;
    //             case 'Жильё':
    //                 newTag.classList.add('tag--purple');
    //                 break;
    //             default:
    //                 newTag.classList.add('tag--custom');
    //                 break;
    //         }
    //         newTag.textContent = selectedCategory[CATEGORY.NAME];
    //         const closeBtn = document.createElement('button');
    //         closeBtn.className = 'btn__del';
    //         closeBtn.textContent = '×';
    //         newTag.appendChild(closeBtn);
    //         document.getElementById('filter-categories-list').appendChild(newTag);

    //         Filtering();
    //     });
    // }

    // const filterCategoriesList = document.getElementById('filter-categories-list');
    // if (filterCategoriesList) {
    //     filterCategoriesList.addEventListener('click', (e) => {
    //         const btn = e.target.closest('.btn__del, .btn__del__cos');
    //         if (!btn) return;
    //         const tag = btn.closest('.tag');
    //         if (tag) {
    //             tag.remove();
    //             Filtering();
    //         }
    //     });
    // }

    // const addCategoryBtn = document.querySelector('.settings__add .choose-color:last-child');
    // if (addCategoryBtn) {
    //     addCategoryBtn.addEventListener('click', () => {
    //         const nameInput = document.getElementById('category-name');
    //         const colorInput = document.querySelector('.settings__add input[type="color"]');
    //         const name = nameInput?.value.trim();
    //         const hex = colorInput?.value;
    //         if (name && hex) {
    //             AddCategory(name, hex);
    //             populateCategorySelect();
    //             nameInput.value = '';
    //         }
    //     });
    // }
    // События

    // Если что-то работает не так - писать в общий чат, разобъём обратно на отдельные функции списки
    function delegate(actionsMap) {
        return (e) => {
            const btn = e.target.closest("[data-action]");
            if (!btn) return;

            if (btn.type === "submit" || btn.dataset.action === "save-transaction") {
                e.preventDefault();
            }

            const item = btn.closest("[data-id]");
            const ctx = { e, id: item?.dataset.id, ...btn.dataset };
            const name = btn.dataset.action;

            console.log(`ctx, состояние:`, ctx);
            if (actionsMap[name]) actionsMap[name](ctx);
        };
    }

    const addTransactionBtn = document.getElementById("add-transaction-button");
    if (addTransactionBtn) addTransactionBtn.addEventListener("click", delegate(action));

    const header = document.getElementById("header");
    if (header) header.addEventListener("click", delegate(action));

    const transactionsListEl = document.getElementById("transactions-list");
    if (transactionsListEl) transactionsListEl.addEventListener("click", delegate(action));

    const addEditTransactionEl = document.getElementById("add-edit-transaction");
    if (addEditTransactionEl) addEditTransactionEl.addEventListener("click", delegate(action));

    const settingsEl = document.getElementById("settings");
    if (settingsEl) settingsEl.addEventListener("click", delegate(action));

    //События фильтров

    const orderingEl = document.getElementById("ordering-sort");
    if (orderingEl) {
        orderingEl.addEventListener("change", (e) => {
            console.log("orderingEl change");
            filter["ordering"] = !e.target.checked;
            SubFilteringFuntions();
        });
    }

    const typeSortEl = document.getElementById("type-sort");
    if (typeSortEl) {
        typeSortEl.addEventListener("change", (e) => {
            filter["type-sort"] = e.target.value;
            SubFilteringFuntions();
        });
    }

    const typeTransEl = document.getElementById("type-transaction-sort");
    if (typeTransEl) {
        typeTransEl.addEventListener("change", (e) => {
            filter["type-transaction"] = e.target.value;
            UpdateFilterCategoryState();
            SubFilteringFuntions();
        });
    }

    // const categorySortEl = document.getElementById("category-sort");
    // if () {} //До поправки html

    const categorySortEl = document.getElementById("category-sort");
    if (categorySortEl) {
        categorySortEl.addEventListener("change", (e) => {
            const selectedId = Number(e.target.value);
            if (!isNaN(selectedId) && selectedId !== 0) {
                // Добавляем в фильтр, если ещё не выбрана
                if (!filter["categories"].includes(selectedId)) {
                    filter["categories"].push(selectedId);
                }
            }
            SubFilteringFuntions();
            // Сбрасываем select обратно на заглушку после выбора
            categorySortEl.value = "";
        });
    }

    const startDateEl = document.getElementById("start-date-sort");
    if (startDateEl) {
        startDateEl.addEventListener("change", (e) => {
            const val = e.target.value;
            filter["start-date"] = val ? new Date(val).getTime() : null;
            SubFilteringFuntions();
        });
    }

    const endDateEl = document.getElementById("end-date-sort");
    if (endDateEl) {
        endDateEl.addEventListener("change", (e) => {
            const val = e.target.value;
            if (val) {
                const endDate = new Date(val);
                endDate.setDate(endDate.getDate() + 1);
                filter["end-date"] = endDate.getTime() - 1;
            } else {
                filter["end-date"] = null;
            }
            SubFilteringFuntions();
        });
    }

    function UpdateCategorySelectState() {
        const categorySelect = document.getElementById("form-transaction-category");
        if (!categorySelect) return;

        const selectedType = document.querySelector('input[name="type"]:checked')?.value;

        if (selectedType === "income") {
            categorySelect.disabled = true;
            categorySelect.value = "";
            const placeholder = categorySelect.querySelector("option[data-placeholder]");
            if (placeholder) placeholder.selected = true;
        } else if (selectedType === "expense") {
            categorySelect.disabled = false;
        }
    }

    function UpdateFilterCategoryState() {
        const typeVal = document.getElementById("type-transaction-sort")?.value;
        const categorySelect = document.getElementById("category-sort");
        if (!categorySelect) return;

        if (typeVal === "income") {
            categorySelect.disabled = true;
            categorySelect.value = ""; 
        } else {
            
            categorySelect.disabled = false;
        }
    }
});
