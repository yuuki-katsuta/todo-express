'use strict';

const express = require('express');

let todos = [
  { id: 1, title: 'ネーム', completed: false },
  { id: 2, title: '下書き', completed: true },
];
const app = express();
app.use(express.json()); //リクエストボディをパースするミドルウェア。res.bodyからパース結果を取得できる

//TODO一覧取得
app.get('/api/todos', (req, res) => {
  //クエリパラメータが指定されていない場合そのまま返す
  if (!req.query.completed) {
    //api/todos?completed=falseのとき,req.query.completedはstringのfalseを表すため、その論理演算はfalse(boolean)となる
    return res.json(todos);
  }
  const completed = req.query.completed === 'true';
  //クエリパラメーターを指定したときTODOをフィルタリング
  res.json(todos.filter((todo) => todo.completed === completed));
});

// 全クライアントに対するSSE送信関数を保持する配列
let sseSenders = [];
// SSEのIDを管理するための変数
let sseId = 1;

// ToDo一覧の取得（SSE）
app.get('/api/todos/events', (req, res) => {
  // タイムアウトを抑止(ソケットのタイムアウトを設定)。リクエストを受け取るまでタイムアウトにならない
  req.socket.setTimeout(0);
  //setでヘッダーのHTTP応答を設定します
  res.set({
    // SSEであることを示すMIMEタイプ
    'Content-Type': 'text/event-stream',
  });
  // クライアントにSSEを送信する関数を作成して登録
  const send = (id, data) => res.write(`id: ${id}\ndata: ${data}\n\n`); // writeでデータの書き込み
  sseSenders.push(send);
  // リクエスト発生時点の状態を送信
  send(sseId, JSON.stringify(todos));
  // リクエストがクローズ(リクエスト中止？)されたらレスポンスを終了してSSE送信関数を配列から削除
  req.on('close', () => {
    res.end();
    sseSenders = sseSenders.filter((_send) => _send !== send);
  });
});

/** ToDoの更新に伴い、全クライアントに対してSSEを送信する */
function onUpdateTodos() {
  sseId += 1;
  const data = JSON.stringify(todos);
  sseSenders.forEach((send) => send(sseId, data));
}

//todoのID
let id = 2;

//todo新規登録
app.post('/api/todos', (req, res, next) => {
  const { title } = req.body;
  if (typeof title !== 'string' || !title) {
    const err = new Error('title is required');
    err.statusCode = 400;
    return next(err); // nextが引数(エラー)付きで呼び出されたときエラーハンドリングミドルウェアで処理をする
  }
  //todo作成
  const todo = { id: (id += 1), title, completed: false };
  todos.push(todo);
  //201(created)
  res.status(201).json(todos);
  onUpdateTodos();
});

// 指定されたIDのToDoを取得するためのミドルウェア
app.use('/api/todos/:id(\\d+)', (req, res, next) => {
  const targetId = Number(req.params.id); // :idを取得
  const todo = todos.find((todo) => todo.id === targetId);
  if (!todo) {
    const err = new Error('ToDo not found');
    err.statusCode = 404;
    return next(err);
  }
  req.todo = todo; //後続のハンドラから参照可能にする
  next(); //ミドルウェアがレスポンスを返さない場合、後続のミドルウェアに処理を受け渡す
});

// ToDoのCompletedの設定、解除
app
  .route('/api/todos/:id(\\d+)/completed')
  .put((req, res) => {
    // req.todoはミドルウェアにより指定されたIDのToDoとなる
    req.todo.completed = true;
    res.json(req.todo);
    onUpdateTodos();
  })
  .delete((req, res) => {
    req.todo.completed = false;
    res.json(req.todo);
    onUpdateTodos();
  });

// ToDoの削除
app.delete('/api/todos/:id(\\d+)', (req, res) => {
  todos = todos.filter((todo) => todo !== req.todo);
  res.status(204).end();
  onUpdateTodos();
});

//エラーハンドリングミドルウェア(4つ引数をとる)
app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.statusCode || 500).json({ error: err.message }); //ステータスコードを指定してレスポンスを返す
});
app.listen(3000);

const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });

nextApp.prepare().then(
  // pagesディレクトリ内の各Reactコンポーネントに対するサーバサイドルーティング
  () => app.get('*', nextApp.getRequestHandler()),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
