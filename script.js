document.addEventListener('DOMContentLoaded', function() {

    const IMAGE_URL = 'state-of-Kitano.png';
    currentImageFilename = (IMAGE_URL.lastIndexOf('.') > 0) ? IMAGE_URL.substring(0, IMAGE_URL.lastIndexOf('.')) : IMAGE_URL;
    const imageUploadInput = document.getElementById('image-upload');
    
    // --- 操作するHTML要素を取得 ---
    const gridContainer = document.getElementById('grid-container');
    const brainstormContainer = document.querySelector('.brainstorm-container'); // 親コンテナ
    const rowsInput = document.getElementById('input-rows');
    const colsInput = document.getElementById('input-cols');
    const applyButton = document.getElementById('apply-grid-button');
    const exportCsvButton = document.getElementById('export-csv-button');
    const csvUploadInput = document.getElementById('csv-upload');

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
            cell.contentEditable = false; // 初期状態は編集不可
            cell.tabIndex = 0; // キーボードでフォーカスできるようにする

            // --- セルのイベントリスナー ---
            
            // 1. セルがフォーカスを失った時 (blur)
            cell.addEventListener('blur', (e) => {
                // 編集モードだったら、編集不可に戻す
                if (e.target.contentEditable === 'true') {
                    e.target.contentEditable = false;
                }
            });

            // (オプション) ダブルクリックで編集モードに入る
            cell.addEventListener('dblclick', (e) => {
                enterEditMode(e.target);
            });
            
            gridContainer.appendChild(cell);
        }
        

        // (DOMが描画された後に実行するため、一瞬遅れる可能性あり)
        requestAnimationFrame(() => {
            const allCells = gridContainer.querySelectorAll('.cell');
            if (allCells.length === 0) return;

            // 最初のセルの幅を基準にする
            const cellWidth = allCells[0].offsetWidth; 
            const FONT_RATIO = 0.29; // 割合 (10%)
            const fontSizePx = cellWidth * FONT_RATIO;

            // 全セルに同じフォントサイズを適用
            allCells.forEach(cell => {
                cell.style.fontSize = fontSizePx + 'px';
            });
        });
    }

    /**
     * 指定されたセルを編集モードにする関数
     */
    function enterEditMode(cell) {
        if (!cell) return;
        cell.contentEditable = true; // 編集可能にする
        cell.focus(); // 即座にフォーカスしてカーソルを入れる
        try {
            const selection = window.getSelection();
            const range = document.createRange();

            // 4. レンジ（範囲）をセルの内容全体に設定
            range.selectNodeContents(cell);
            
            // 5. レンジを「末尾」に折りたたむ (カーソルを最後に移動)
            //    (もし先頭に置きたい場合は false を true にする)
            range.collapse(false); 

            // 6. 現在の選択範囲をすべてクリア
            selection.removeAllRanges();
            
            // 7. 新しく作ったレンジ（カーソル位置）を適用する
            selection.addRange(range);
            
        } catch (err) {
            console.error("カーソルの設定に失敗しました: ", err);
        }
    }

    /**
     * 画像が読み込まれた後に、コンテナのサイズを調整し、グリッドを再描画する関数
     * @param {string} imageUrl - (Data URL形式の) 画像URL
     */
    function setupImageAndGrid(imageUrl) {
        
        // 1. コンテナの背景に画像を設定
        brainstormContainer.style.backgroundImage = `url('${imageUrl}')`;
        // 2. プレースホルダーテキストを消去 (CSSのcolorを透明にする)
        brainstormContainer.style.color = 'transparent';
        // 3. CSSのflexbox設定を解除 (プレースホルダー用だったため)
        brainstormContainer.style.display = 'block'; 

        // 4. 画像をメモリに読み込んでアスペクト比を計算
        const img = new Image();
        
        img.onload = function() {
            // 5. アスペクト比をコンテナのCSSに設定
            const imgWidth = this.naturalWidth;
            const imgHeight = this.naturalHeight;
            brainstormContainer.style.aspectRatio = `${imgWidth} / ${imgHeight}`;

            // 6. アスペクト比が確定した後、現在の入力値でグリッドを再描画
            // (これをしないと、画像ロード前の古い高さのグリッドが残るため)
            const currentRows = parseInt(rowsInput.value, 10);
            const currentCols = parseInt(colsInput.value, 10);
            createGrid(currentRows, currentCols);
        };
        
        img.onerror = function() {
            alert('画像の読み込みに失敗しました。');
            // エラー時はプレースホルダー状態に戻す
            brainstormContainer.style.backgroundImage = 'none';
            brainstormContainer.style.color = '#888';
            brainstormContainer.style.display = 'flex';
        };

        // 7. 画像読み込みを開始（img.onload が発火する）
        img.src = imageUrl;
    }

    /**
     * CSVエクスポート処理
     */
    function exportToCsv() {
        const rows = parseInt(rowsInput.value, 10);
        const cols = parseInt(colsInput.value, 10);
        // gridContainer にある .cell 要素をすべて取得
        const cells = gridContainer.querySelectorAll('.cell');
        
        let csvContent = ""; // CSVデータ文字列

        for (let r = 0; r < rows; r++) {
            let rowData = [];
            for (let c = 0; c < cols; c++) {
                // (r * cols + c) で、r行c列目に対応するセルのインデックスを計算
                const cell = cells[r * cols + c];
                let cellText = cell ? cell.innerText : ""; // セルのテキストを取得

                // 1. テキスト内の改行を半角スペースに置換（CSVの1行が崩れないように）
                cellText = cellText.replace(/\r?\n/g, " ");
                
                // 2. カンマ(,)やダブルクォート(")が含まれる場合は、" で囲む (RFC 4180準拠)
                if (cellText.includes(",")) {
                    cellText = `"${cellText}"`;
                }

                rowData.push(cellText);
            }
            // 1行分のデータをカンマで結合し、末尾に改行を追加
            csvContent += rowData.join(",") + "\r\n";
        }

        // CSVファイルを作成してダウンロード
        // BOM (Byte Order Mark) を先頭につけて文字化けを防ぐ
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        const downloadName = `${currentImageFilename}.csv`;
        link.setAttribute("download", downloadName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * CSVインポート処理
     */
    function importFromCsv(csvText) {
        const beforecells = document.getElementsByClassName('cell');
        console.log(beforecells.item(0).textContent);
        for(let i=0; i<beforecells.length; i++){
            if(beforecells[i].textContent != ""){
                if(!window.confirm("セルに文字が入力されたままです。更新しますか？")){
                    return;
                }else{
                    break;
                }
            }
        }

        // CSVを行ごとに分割
        const csvRows = csvText.trim().split(/\r?\n/);
        
        // CSVの行数・列数を取得
        const newRows = csvRows.length;
        const newCols = csvRows[0] ? csvRows[0].split(',').length : 0;

        if (newRows === 0 || newCols === 0) {
            alert('有効なデータがCSVに含まれていません。');
            return;
        }

        // GUIの入力欄をCSVのサイズに更新
        rowsInput.value = newRows;
        colsInput.value = newCols;
        
        // 新しいグリッドを生成
        createGrid(newRows, newCols);

        // 新しく生成されたセルを取得
        const cells = gridContainer.querySelectorAll('.cell');
        
        // データをセルに流し込む
        for (let r = 0; r < newRows; r++) {
            const rowData = csvRows[r].split(',');
            for (let c = 0; c < newCols; c++) {
                const cellIndex = r * newCols + c;
                if (cells[cellIndex] && rowData[c] !== undefined) {
                    
                    let cellText = rowData[c];

                    // 1. もしデータが " で囲まれていたら、" を除去
                    if (cellText.startsWith('"') && cellText.endsWith('"')) {
                        cellText = cellText.substring(1, cellText.length - 1);
                    }
                    
                    // (エクスポート時に改行をスペースに変換したので、インポート時は特別な処理は不要)
                    cells[cellIndex].innerText = cellText;
                }
            }
        }
    }

    gridContainer.addEventListener('keydown', (e) => {
        const activeCell = document.activeElement;

        // フォーカスされているのがセルでなければ何もしない
        if (!activeCell || !activeCell.classList.contains('cell')) {
            return;
        }

        // 現在のセルの状態
        const isEditing = activeCell.contentEditable === 'true';
        
        // --- 1. Enterキーの処理 ---
        if (e.key === 'Enter') {
            e.preventDefault(); // デフォルトの改行動作をキャンセル
            
            // ▼▼▼ 変更点 ▼▼▼
            // Shiftキーが押されているかどうかを確認
            const isShiftPressed = e.shiftKey;
            
            if (isEditing) {
                // 編集モードの場合: 編集を終了し、移動
                
                // Shiftが押されていれば 'ArrowUp', 押されていなければ 'ArrowDown'
                const direction = isShiftPressed ? 'ArrowUp' : 'ArrowDown';
                
                const nextCell = getNextCell(activeCell, direction);
                if (nextCell) {
                    nextCell.focus();
                } else {
                    activeCell.blur(); // 移動先がなければフォーカスを外す
                }
            } else {
                // 移動モードの場合:
                
                if (isShiftPressed) {
                    const nextCell = getNextCell(activeCell, 'ArrowUp');
                     if (nextCell) {
                        nextCell.focus();
                    }
                } else {
                    // Enter (移動モード) -> 編集モードに入る
                    enterEditMode(activeCell);
                }
            }
            return; // Enterキーの処理はここで終わり
            // ▲▲▲ 変更点 ▲▲▲
        }
        
        // --- 2. Escキーの処理 (編集モードのキャンセル) ---
        if (e.key === 'Escape' && isEditing) {
            activeCell.contentEditable = false; // 編集モードを終了
            activeCell.focus(); // 移動モードでフォーカスし直す
            return;
        }

        // --- 3. 矢印キーの処理 ---
        // (編集モード中は、矢印キーをテキスト内のカーソル移動に使うため、何もしない)
        if (isEditing) {
            return;
        }

        // (移動モードの場合のみ、矢印キーでセルを移動)
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault(); // ページのスクロールなどを防ぐ
            
            const nextCell = getNextCell(activeCell, e.key);
            if (nextCell) {
                nextCell.focus();
            }
        }
    });

    /**
     * 現在のセルと押されたキーに基づき、次のセルを返す
     */
    function getNextCell(currentCell, direction) {
        const allCells = Array.from(gridContainer.querySelectorAll('.cell'));
        const cols = parseInt(colsInput.value, 10);
        const currentIndex = allCells.indexOf(currentCell);

        if (currentIndex === -1) return null;

        let nextIndex = -1;

        switch (direction) {
            case 'ArrowUp':
                nextIndex = currentIndex - cols;
                break;
            case 'ArrowDown':
                nextIndex = currentIndex + cols;
                break;
            case 'ArrowLeft':
                // 左端でなければ左へ、左端なら何もしない
                if (currentIndex % cols !== 0) {
                    nextIndex = currentIndex - 1;
                }
                break;
            case 'ArrowRight':
                // 右端でなければ右へ、右端なら何もしない
                if ((currentIndex + 1) % cols !== 0) {
                    nextIndex = currentIndex + 1;
                }
                break;
        }

        // 範囲外チェック
        if (nextIndex < 0 || nextIndex >= allCells.length) {
            return null; // グリッドの端
        }

        return allCells[nextIndex];
    }

    // --- イベントリスナー（動作のきっかけ）の設定 ---

    // 「グリッドを更新」ボタンがクリックされた時の処理
    applyButton.addEventListener('click', function() {
        const beforecells = document.getElementsByClassName('cell');
        console.log(beforecells.item(0).textContent);
        for(let i=0; i<beforecells.length; i++){
            if(beforecells[i].textContent != ""){
                if(!window.confirm("セルに文字が入力されたままです。更新しますか？")){
                    return;
                }else{
                    break;
                }
            }
        }
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

    // 「ファイル選択」で新しい画像が選ばれた時の処理
    imageUploadInput.addEventListener('change', function(event) {
        // 選択されたファイルを取得
        const file = event.target.files[0];
        
        if (!file) {
            // ファイル選択がキャンセルされた場合は何もしない
            return;
        }

        // ファイル名を取得し、拡張子を除いた部分を保存
        const filename = file.name;
        // (例: "my_image.jpg" -> "my_image", "file.with.dots.png" -> "file.with.dots")
        // 最後の . より前を取得する。 . が無ければファイル名全体を使う
        const basename = (filename.lastIndexOf('.') > 0) ? filename.substring(0, filename.lastIndexOf('.')) : filename;
        currentImageFilename = basename;

        // FileReaderを使ってローカルファイルを読み込む
        const reader = new FileReader();

        // 読み込みが完了した時の処理
        reader.onload = function(e) {
            // e.target.result に Data URL (base64エンコードされた画像データ) が入る
            const dataUrl = e.target.result;
            // 画像設定とグリッド再描画の関数を呼び出す
            setupImageAndGrid(dataUrl);
        };
        
        reader.onerror = function() {
            alert('ファイルの読み込みに失敗しました。');
        };

        // ファイルの読み込みを実行（Data URLとして）
        reader.readAsDataURL(file);
    });

    exportCsvButton.addEventListener('click', function() {
        exportToCsv();
    });

    // 「CSVインポート」でファイルが選択された時の処理
    csvUploadInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        
        // テキストファイルとして読み込み完了した時の処理
        reader.onload = function(e) {
            const csvText = e.target.result;
            importFromCsv(csvText);
        };
        
        reader.onerror = function() {
            alert('CSVファイルの読み込みに失敗しました。');
        };

        // ファイルをテキストとして読み込む
        reader.readAsText(file);

        // (重要) 同じファイルを連続で読み込めるように、入力値をリセットする
        event.target.value = null;
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