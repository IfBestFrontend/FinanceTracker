// Глобальные переменные и константы


const UI_TEXT = {
    // Для add-edit-transaction
    transaction_editTitle: "Редактирование транзакции",
    transaction_addTitle: "Новая транзакция",
    transaction_saveBtn: "Сохранить",
    transaction_addBtn: "Добавить",

    // Для nnn
};

const action = {
    "close-dialog": () => CloseDialog(),
    "open-edit-transaction": (ctx) => OpenEditTransaction(ctx.id),
    "delete-transaction": (ctx) => DeleteTransactions(ctx.id),
    "toggle-theme": () => ToggleTheme(),
    "show-more": () => ShowMoreTransactions(),
    "open-settings": () => OpenSettings(),
}


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
const TRANSACTIONS_BATCH_SIZE = 5;
let g_maxOutputTransaction = 0;

const actions = {
    "show-comment": (ctx) => ToggleComment(ctx.id),
};

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

function CloseDialog(e) {}

function OpenSettings() {
    const dialog = document.getElementById('settings');
    if (dialog) dialog.showModal(); 

}
function OpenEditTransaction(){

}

function CreateOptionsToFormTransactionCategory() {
    const select = document.getElementById('form-transaction-category');
    if (!select) return;

    const selectedValue = select.value;

    select.innerHTML = '<option disabled selected>Выберите категорию</option>';

    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat[CATEGORY.ID];
        option.textContent = cat[CATEGORY.NAME];
        select.appendChild(option);
    });

    if (selectedValue && Array.from(select.options).some(opt => opt.value == selectedValue)) {
        select.value = selectedValue;
    }
}

//Основные функции
function ShowMoreTransactions(count) {
    if (g_currentOutputTransaction >= filteredTransactions.length) {
        const btn = document.getElementById('show-more');
        if (btn) btn.style.display = 'none';
        console.warn('ShowMoreTransactions: все транзакции уже показаны');
        return;
    }

    const remaining = filteredTransactions.length - g_currentOutputTransaction;
    const toShow = Math.min(count, remaining);
    if (toShow <= 0) return;

    const container = document.querySelector('.transaction-list');
    const template = document.getElementById('transaction');
    if (!container || !template) {
        console.error('Не найден контейнер или шаблон');
        return;
    }

    filteredTransactions
        .slice(g_currentOutputTransaction, g_currentOutputTransaction + toShow)
        .forEach(tr => {
            const clone = template.content.cloneNode(true);
            const div = clone.querySelector('.transaction');
            if (!div) return;

            div.dataset.id = tr[TRANSACTION.ID];

            // dot
            const dot = clone.querySelector('.transaction__dot');
            if (dot) {
                const dotColor = tr[TRANSACTION.TYPE] === 'expense' ? '#ff3b3b' : '#4ea3ff';
                dot.style.setProperty('--dot-color', dotColor);
            }

            // amount
            const amountEl = clone.querySelector('.transaction__amount');
            if (amountEl) {
                const sign = tr[TRANSACTION.TYPE] === 'income' ? '+' : '-';
                amountEl.textContent = `${sign} ${tr[TRANSACTION.SUMM].toFixed(2)} ₽`;
            }

            // category
            const catEl = clone.querySelector('.transaction__category');
            if (catEl) {
                if (tr[TRANSACTION.TYPE] === 'expense' && tr[TRANSACTION.CATEGORY]) {
                    const cat = categories.find(c => c[CATEGORY.ID] === tr[TRANSACTION.CATEGORY]);
                    catEl.textContent = cat ? cat[CATEGORY.NAME] : '';
                    catEl.style.display = '';
                } else {
                    catEl.style.display = 'none';
                }
            }

            // date
            const dateEl = clone.querySelector('.transaction__date');
            if (dateEl) {
                dateEl.textContent = new Date(tr[TRANSACTION.DATE]).toLocaleDateString('ru-RU');
            }

            // note
            const noteEl = clone.querySelector('.transaction__note');
            const moreBtn = clone.querySelector('.transaction__more');
            if (noteEl) {
                if (tr[TRANSACTION.COMMENT] && tr[TRANSACTION.COMMENT].trim() !== '') {
                    noteEl.textContent = tr[TRANSACTION.COMMENT];
                    noteEl.classList.remove('hidden'); // видим
                } else {
                    noteEl.textContent = ''; 
                    noteEl.classList.add('hidden');
                    if (moreBtn) moreBtn.style.display = 'none'; 
                }
            }

            container.appendChild(clone);
        });

    g_currentOutputTransaction += toShow;
    const showMoreBtn = document.getElementById('show-more');
    if (showMoreBtn) {
        showMoreBtn.style.display = g_currentOutputTransaction >= filteredTransactions.length ? 'none' : 'block';
    }
}

function ToggleComment(transactionId) {
    const transaction = document.querySelector(`.transaction[data-id="${transactionId}"]`);
    if (!transaction) return;
    const note = transaction.querySelector('.transaction__note');
    const button = transaction.querySelector('.transaction__more');
    if (!note) return;
    if (!note.textContent.trim()) return;

    note.classList.toggle('hidden');

    if (button) {
        const img = button.querySelector('img');
        if (img) {
            if (img.style.transform === 'rotate(180deg)') {
                img.style.transform = '';
            } else {
                img.style.transform = 'rotate(180deg)';
            }
        }
    }
}

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
    CreateOptionsToFormTransactionCategory(); 
}

function GetTransactionFormValues() {
    try {
        const dialog = document.getElementById("addEditTransaction");
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
                throw new Error(`GetFormValues: category должен быть числовым id, получено (${categoryRaw})`);
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

//Отрисовка и сабы отрисовки (до сортировки)
//

function CreateExpenseList(list) { }

function RenderExpenseChart() {
    const EXPENSE_LIST = CreateExpenseList(filteredTransactions);
}

function CreateNDayTransactionList(day) { }

function RenderBalanceChart(day) {
    // было: N_DAY_TRANSACTION_LIST
    let nDaysTransaction = CreateNDayTransactionList(day);
}

function ToggleTheme() {

}



//Отладка
function StateLog() {
    console.log(`StateLog: проверка актиальных данных.`);
    console.log(`LOCALSTORAGE_KEY:`, LOCALSTORAGE_KEY);
    console.log(`categories: `, categories);
    console.log(`transactions: `, transactions);
    console.log(`BASE_CATEGORIES: `, BASE_CATEGORIES);
    console.log(`filteredTransactions: `, filteredTransactions);
    console.log(`g_currentOutputTransaction: `, g_currentOutputTransaction)
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
    CreateOptionsToFormTransactionCategory();
    LoadTransactions();

    // Инициализация пагинации
    filteredTransactions = [...transactions];
    g_currentOutputTransaction = 0;

    ShowMoreTransactions(TRANSACTIONS_BATCH_SIZE);

    const showMoreBtn = document.getElementById('show-more');
    if (showMoreBtn) {
        showMoreBtn.onclick = () => ShowMoreTransactions(TRANSACTIONS_BATCH_SIZE);
    }

    const transactionsContainer = document.querySelector('.transaction-list');
    if (transactionsContainer) {
        transactionsContainer.addEventListener('click', (event) => {
            const btn = event.target.closest('[data-action]');
            if (!btn) return;
            const actionName = btn.getAttribute('data-action');
            const actionFn = actions[actionName];
            if (actionFn) {
                const transaction = btn.closest('.transaction');
                if (transaction) {
                    const ctx = { id: transaction.dataset.id, element: transaction };
                    actionFn(ctx);
                }
            }
        });
    }

    StateLog();
    // return;
    
    
    
    
    
    // События
    
    // Если что-то работает не так - писать в общий чат, разобъём обратно на отдельные функции списки
    function delegate(actionsMap) {
        return (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const item = btn.closest('[data-id]');
            const ctx = { e, id: item?.dataset.id, ...btn.dataset };
            const name = btn.dataset.action;
            if (actionsMap[name]) actionsMap[name](ctx);
        };
    }

    document.getElementById('header').addEventListener('click', delegate(action));

    document.getElementById('transactionsList').addEventListener('click', (action));


})