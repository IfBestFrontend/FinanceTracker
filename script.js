// Глобальные переменные и константы

const UI_TEXT = {
    // Для add-edit-transaction
    transaction_editTitle: "Редактирование транзакции",
    transaction_addTitle: "Новая транзакция",
    transaction_saveBtn: "Сохранить",
    transaction_addBtn: "Добавить"
    
    // Для nnn
}

const TRANSACTION = {
  ID: 'id',
  TYPE: 'type',
  CATEGORY: 'category',
  DATE: 'date',
  COMMENT: 'comment',
};

const ALL_TRANSACTION_LIST = []

// const FilteredTransactionList
const FILTERED_TRANSACTION_LIST = []

let g_currentOutputTransaction = 0;
let g_maxOutputTransaction = 0;





//основные вспомогательные функции
function CreateTransactionID() {

}

function CollectTransactionObject(id, type, category, date, comment){
    const dateObj = new Date(date);
    if (Number.isNaN(dateObj.getTime())) {
        throw new Error("Invalid input date"); 
        return null;
    }
    return {
        [TRANSACTION.ID]: id,
        [TRANSACTION.TYPE]: type,
        [TRANSACTION.CATEGORY]: category,
        [TRANSACTION.DATE]: dateObj.getTime(),
        [TRANSACTION.COMMENT]: comment
    }
}

function CollectTransactionObject(type, category, date, comment) {
    return CollectTransactionObject(
        CreateTransactionID(), type, category, date, comment
    )
}


function CreateDemoTransaction() {

}

function LoadAllTransactionList() {

}

function UpdateLocalStorageTransactions() {
    
}



//Основные функции

function ShowMoreTransactions(){

}

function AddTransaction() {

}

function EditTransaction() {
    
}

//Отрисовка




// ---------ОСНОВНОЙ КОД----------
