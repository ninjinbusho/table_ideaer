document.addEventListener('DOMContentLoaded', function() {

    const IMAGE_URL = 'state-of-Kitano.png';
    
    // --- 操作するHTML要素を取得 ---
    const gridContainer = document.getElementById('grid-container');
    const brainstormContainer = document.querySelector('.brainstorm-container'); // 親コンテナ
    const rowsInput = document.getElementById('input-rows');
    const colsInput = document.getElementById('input-cols');
    const applyButton = document.getElementById('apply-grid-button');

    /**
     * グリッドを生成・再描画する関数
     * @param {number} rows - 行数
     * @param {number} cols - 列数
     */
    function createGrid(rows, cols) {
        
        // 1. 古いグリッドを削除（コンテナの中身を空にする）
        gridContainer.innerHTML = '';

        // 2. CSSのグリッド設定（分割数）を更新
        gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

        // 3. セルを新しく生成して配置
        const totalCells = rows * cols;
        
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.contentEditable = true; // 編集可能にする
            
            gridContainer.appendChild(cell);
        }
    }

    // --- イベントリスナー（動作のきっかけ）の設定 ---

    // 「グリッドを更新」ボタンがクリックされた時の処理
    applyButton.addEventListener('click', function() {
        // 入力欄から値を取得し、数値に変換
        // (parseIntの第2引数 10 は「10進数」という意味です)
        const newRows = parseInt(rowsInput.value, 10);
        const newCols = parseInt(colsInput.value, 10);

        // 値が正常（1以上）かチェック
        if (newRows >= 1 && newCols >= 1) {
            // グリッドを再生成
            createGrid(newRows, newCols);
        } else {
            alert('行数と列数は1以上の数値を入力してください。');
        }
    });

    // --- ページの初期化（画像の読み込みとサイズ設定） ---
    
    // 1. 画像のURLをコンテナの背景に設定
    brainstormContainer.style.backgroundImage = `url('${IMAGE_URL}')`;

    // 2. 画像をメモリに読み込んで、サイズを取得
    const img = new Image();
    
    // 3. 画像の読み込みが完了した時の処理
    img.onload = function() {
        // 画像の固有の幅 (naturalWidth) と 高さ (naturalHeight) を取得
        const imgWidth = this.naturalWidth;
        const imgHeight = this.naturalHeight;
        
        // 4. コンテナのCSSにアスペクト比を設定
        // (例: 1920x1080 の画像なら '1920 / 1080' が設定される)
        brainstormContainer.style.aspectRatio = `${imgWidth} / ${imgHeight}`;

        // 5. 画像サイズが確定した後で、最初のグリッドを描画
        // (これを img.onload の外で行うと、サイズ確定前にグリッドが描画されてしまう)
        const initialRows = parseInt(rowsInput.value, 10);
        const initialCols = parseInt(colsInput.value, 10);
        createGrid(initialRows, initialCols);
    };

    // 4. 画像読み込み失敗時の処理
    img.onerror = function() {
        console.error('画像の読み込みに失敗しました。URLを確認してください: ', IMAGE_URL);
        alert('画像の読み込みに失敗しました。URLを確認してください。');
        
        // エラー時は、念のため適当な高さを設定
        brainstormContainer.style.height = '70vh'; 

        // グリッドだけは描画する
        const initialRows = parseInt(rowsInput.value, 10);
        const initialCols = parseInt(colsInput.value, 10);
        createGrid(initialRows, initialCols);
    };

    // 5. 画像の読み込みを開始
    // (この行が img.onload と img.onerror の *後* にあることが重要)
    img.src = IMAGE_URL;

});