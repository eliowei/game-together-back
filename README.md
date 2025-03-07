# GameTogether 遊戲揪團平台後端

以 Node.js 結合 MongoDB 進行資料儲存與管理

相關連結: [前端](https://github.com/eliowei/game-together)


## API功能
- 註冊 & 登入 - 使用者註冊、登入系統
- 身份驗證 - JWT 驗證、權限管理
- 揪團 - 查詢、搜尋篩選、主辦活動、參加、收藏
- 留言 - 發表留言、回覆留言、編輯留言
- 聊天室 - 即時聊天、訊息記錄
- 管理 - 使用者管理、會員管理、聯絡表單管理


## 專案技術
- Express 建立伺服器和處理路由
- Mongoose 連接 MongoDB 並定義資料模型，方便資料的 CRUD 操作
- Multer 處理文件上傳並搭配cloudinary進行雲端儲存 
- http-status-codes 提供 HTTP 狀態碼
- validator 進行資料格式驗證，
- ESLint + Prettier 統一程式碼結構


## 使用的套件
| 套件名稱 | 主要功能 |
|-------|-------|
| Express | 建立伺服器和路由處理 API 請求 |
| Mongoose | 連接 MongoDB 並定義資料模型，便於資料處理 |
| jsonwebtoken | 用於產生和驗證 JWT，實現用戶認證與授權 |
| passport |　身份驗證中介套件，支援多種認證方式，包括 JWT |
| CORS | 	處理跨域請求，允許或限制前後端間的資料交換 | 
| Multer | 處理文件上傳，支持多種文件格式和儲存方式 |
| multer-storage-cloudinary | 擴充 Multer，將上傳的文件儲存至 Cloudinary 雲端 |
| http-status-codes | 提供 HTTP 狀態碼，讓代碼更具可讀性和清晰性 |
| validator | 提供多種資料驗證方法 |
| eslint | 靜態代碼分析工具，幫助檢查代碼中錯誤和風格問題 |
| eslint-config-prettier | 配合 Prettier 進行代碼格式化，避免 ESLint 規則衝突 |
