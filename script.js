// グローバル変数として名前、UUID、ビンゴ数、リーチ数、空いているマス数、空いていないマス数を保持
let playerName = "";
let playerUUID = "";
let bingoCount = 0;
let reachCount = 0;
let vacantCount = 0;
let occupiedCount = 0;

function createStartMenu() {
    const body = document.body;
    body.innerHTML = ""; // 既存のコンテンツをクリア

    const startMenu = document.createElement("div");
    startMenu.id = "startMenu";
    startMenu.style.textAlign = "center";

    const title = document.createElement("h1");
    title.textContent = "麻雀役ビンゴ";
    startMenu.appendChild(title);

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "名前を入力してください：";
    startMenu.appendChild(nameLabel);

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.id = "playerName";
    startMenu.appendChild(nameInput);

    const startButton = document.createElement("button");
    startButton.textContent = "スタート";
    startButton.addEventListener("click", () => {
        playerName = document.getElementById("playerName").value;
        if (playerName.trim() === "") {
            alert("名前を入力してください");
            return;
        }
        playerUUID = generateUUIDFromName(playerName);
        updateURLWithUUID(playerUUID); // URLにUUIDを追加
        createBingoCard();
    });
    startMenu.appendChild(startButton);

    body.appendChild(startMenu);
}

function createBingoCard() {
    // URLからUUIDを取得
    const urlParams = new URLSearchParams(window.location.search);
    playerUUID = urlParams.get('uuid') || playerUUID;

    const body = document.body;
    body.innerHTML = ""; // スタートメニューをクリア

    const bingoCardContainer = document.createElement("div");
    bingoCardContainer.id = "bingoCardContainer";
    body.appendChild(bingoCardContainer);

    const bingoCard = document.createElement("table");
    bingoCard.classList.add("bingo-card");
    bingoCard.id = "bingoCard";
    bingoCardContainer.appendChild(bingoCard);

    // ビンゴ数、リーチ数、空いているマス数、空いていないマス数を表示する要素を作成
    const statusContainer = document.createElement("div");
    statusContainer.id = "statusContainer";
    statusContainer.style.textAlign = "center";
    bingoCardContainer.appendChild(statusContainer); //ビンゴカードの下に移動

    const bingoCountElement = document.createElement("p");
    bingoCountElement.id = "bingoCount";
    bingoCountElement.textContent = "ビンゴ数: 0";
    statusContainer.appendChild(bingoCountElement);

    const reachCountElement = document.createElement("p");
    reachCountElement.id = "reachCount";
    reachCountElement.textContent = "リーチ数: 0";
    statusContainer.appendChild(reachCountElement);

    const vacantCountElement = document.createElement("p");
    vacantCountElement.id = "vacantCount";
    vacantCountElement.textContent = "空いているマス数: 24";
    statusContainer.appendChild(vacantCountElement);

    const occupiedCountElement = document.createElement("p");
    occupiedCountElement.id = "occupiedCount";
    occupiedCountElement.textContent = "空いていないマス数: 1";
    statusContainer.appendChild(occupiedCountElement);

    const difficultyLists = {
        easy: [
            "門前自摸", "立直", "一発", "タンヤオ", "平和", "一盃口", "役牌 發", "役牌 中",
            "役牌 東", "役牌 南", "役牌 西", "役牌 北", "槍槓", "嶺上開花", "海底撈月", "河底撈魚"
        ],
        normal: [
            "ダブリー", "七対子", "連風牌", "対々和", "三暗刻", "三色同刻", "三色同順",
            "混老頭", "一気通貫", "チャンタ", "小三元", "三槓子"
        ],
        hard: [
            "混一色", "純チャン", "二盃口", "流し満貫", "清一色"
        ],
        impossible: [
            "天和", "地和", "人和", "緑一色", "大三元", "小四喜", "字一色", "国士無双",
            "九蓮宝燈", "四暗刻", "清老頭", "四槓子", "四暗刻単騎", "大四喜", "純正九蓮宝燈", "国士無双十三面待ち"
        ],
    };

    const difficultyProbabilities = {
        easy: 0.65, // 65%
        normal: 0.2, // 20%
        hard: 0.12, // 12%
        impossible: 0.03, // 3%
    };

    const selectedItems = [];

    // Seed the random number generator based on playerUUID
    const seed = uuidToSeed(playerUUID);
    const seededRandom = createSeededRandom(seed);

    // Generate items for the bingo card
    for (let i = 0; i < 24; i++) { // 24 items (excluding FREE)
        const difficulty = selectDifficulty(difficultyProbabilities, seededRandom);
        const item = selectRandomItem(difficultyLists[difficulty], selectedItems, seededRandom);
        selectedItems.push(item);
    }

    // Create table rows and cells
    let itemIndex = 0;
    for (let row = 0; row < 5; row++) {
        const tr = document.createElement("tr");
        for (let col = 0; col < 5; col++) {
            const td = document.createElement("td");

            if (row === 2 && col === 2) {
                td.textContent = "FREE";
                td.classList.add("free");
                td.classList.add("marked"); // FREEマスを最初からmarkedにする
                // FREEマスはクリックしても何も起こらない
            } else {
                td.textContent = selectedItems[itemIndex];
                itemIndex++;
                td.addEventListener("click", () => {
                    td.classList.toggle("marked");
                    updateBingoStatus(bingoCard); // ビンゴ数、リーチ数、空いているマス数、空いていないマス数を更新
                });
            }

            tr.appendChild(td);
        }
        bingoCard.appendChild(tr);
    }
    //初期化
    bingoCount = 0;
    reachCount = 0;
    vacantCount = 24;
    occupiedCount = 1;
    updateBingoStatus(bingoCard);
}

function selectDifficulty(probabilities, random) {
    const rand = random();
    let cumulativeProbability = 0;
    for (const difficulty in probabilities) {
        cumulativeProbability += probabilities[difficulty];
        if (rand < cumulativeProbability) {
            return difficulty;
        }
    }
    return "impossible"; // Fallback
}

function selectRandomItem(list, usedItems, random) {
    let item;
    do {
        const randomIndex = Math.floor(random() * list.length);
        item = list[randomIndex];
    } while (usedItems.includes(item));
    return item;
}

function uuidToSeed(uuid) {
    let seed = 0;
    for (let i = 0; i < uuid.length; i++) {
        seed += uuid.charCodeAt(i);
    }
    return seed;
}

function createSeededRandom(seed) {
    return function () {
        seed = Math.sin(seed) * 10000;
        return seed - Math.floor(seed);
    };
}

function generateUUIDFromName(name) {
    // 名前の文字コードを合計してシード値を生成
    let seed = 0;
    for (let i = 0; i < name.length; i++) {
        seed += name.charCodeAt(i);
    }

    // シード値からUUIDを生成（簡易的な方法）
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = (seed + Math.random() * 16) % 16 | 0;
        seed = Math.floor(seed / 16);
        let v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    return uuid;
}

function updateURLWithUUID(uuid) {
    const url = new URL(window.location.href);
    url.searchParams.set('uuid', uuid);
    window.history.pushState({}, '', url);
}

function updateBingoStatus(bingoCard) {
    bingoCount = calculateBingoCount(bingoCard);
    reachCount = calculateReachCount(bingoCard);
    vacantCount = calculateVacantCount(bingoCard);
    occupiedCount = calculateOccupiedCount(bingoCard);

    document.getElementById("bingoCount").textContent = "ビンゴ数: " + bingoCount;
    document.getElementById("reachCount").textContent = "リーチ数: " + reachCount;
    document.getElementById("vacantCount").textContent = "未達成マス数: " + vacantCount;
    document.getElementById("occupiedCount").textContent = "達成マス数: " + occupiedCount;
}

function calculateBingoCount(bingoCard) {
    let count = 0;
    const marked = "marked";
    const rows = bingoCard.rows;
    const cols = bingoCard.rows[0].cells.length;

    // 行方向のビンゴをチェック
    for (let i = 0; i < rows.length; i++) {
        let bingo = true;
        for (let j = 0; j < cols; j++) {
            if (!rows[i].cells[j].classList.contains(marked)) {
                bingo = false;
                break;
            }
        }
        if (bingo) count++;
    }

    // 列方向のビンゴをチェック
    for (let j = 0; j < cols; j++) {
        let bingo = true;
        for (let i = 0; i < rows.length; i++) {
            if (!rows[i].cells[j].classList.contains(marked)) {
                bingo = false;
                break;
            }
        }
        if (bingo) count++;
    }

    // 斜め方向のビンゴをチェック (左上から右下)
    let bingoDiagonal1 = true;
    for (let i = 0; i < rows.length; i++) {
        if (!rows[i].cells[i].classList.contains(marked)) {
            bingoDiagonal1 = false;
            break;
        }
    }
    if (bingoDiagonal1) count++;

    // 斜め方向のビンゴをチェック (右上から左下)
    let bingoDiagonal2 = true;
    for (let i = 0; i < rows.length; i++) {
        if (!rows[i].cells[cols - 1 - i].classList.contains(marked)) {
            bingoDiagonal2 = false;
            break;
        }
    }
    if (bingoDiagonal2) count++;

    return count;
}

function calculateReachCount(bingoCard) {
    let count = 0;
    const marked = "marked";
    const rows = bingoCard.rows;
    const cols = bingoCard.rows[0].cells.length;

    // 行方向のリーチをチェック
    for (let i = 0; i < rows.length; i++) {
        let reach = 0;
        for (let j = 0; j < cols; j++) {
            if (rows[i].cells[j].classList.contains(marked)) {
                reach++;
            }
        }
        if (reach === cols - 1) count++;
    }

    // 列方向のリーチをチェック
    for (let j = 0; j < cols; j++) {
        let reach = 0;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].cells[j].classList.contains(marked)) {
                reach++;
            }
        }
        if (reach === rows.length - 1) count++;
    }

    // 斜め方向のリーチをチェック (左上から右下)
    let reachDiagonal1 = 0;
    for (let i = 0; i < rows.length; i++) {
        if (rows[i].cells[i].classList.contains(marked)) {
            reachDiagonal1++;
        }
    }
    if (reachDiagonal1 === rows.length - 1) count++;

    // 斜め方向のリーチをチェック (右上から左下)
    let reachDiagonal2 = 0;
    for (let i = 0; i < rows.length; i++) {
        if (rows[i].cells[cols - 1 - i].classList.contains(marked)) {
            reachDiagonal2++;
        }
    }
    if (reachDiagonal2 === rows.length - 1) count++;

    return count;
}

function calculateVacantCount(bingoCard) {
    let count = 0;
    const marked = "marked";
    const rows = bingoCard.rows;
    const cols = bingoCard.rows[0].cells.length;

    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < cols; j++) {
            if (!rows[i].cells[j].classList.contains(marked)) {
                count++;
            }
        }
    }
    return count;
}

function calculateOccupiedCount(bingoCard) {
    let count = 0;
    const marked = "marked";
    const rows = bingoCard.rows;
    const cols = bingoCard.rows[0].cells.length;

    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < cols; j++) {
            if (rows[i].cells[j].classList.contains(marked)) {
                count++;
            }
        }
    }
    return count;
}

// ページ読み込み時に処理を分岐
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('uuid')) {
        playerUUID = urlParams.get('uuid');
        createBingoCard();
    } else {
        createStartMenu();
    }
});
