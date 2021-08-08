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
  })
  .delete((req, res) => {
    req.todo.completed = false;
    res.json(req.todo);
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
