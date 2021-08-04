'use strict';
const express = require('express');

let todos = [
  { id: 1, title: 'ネーム', completed: false },
  { id: 2, title: '下書き', completed: true },
];
const app = express();
//TODO一覧取得
app.get('/api/todos', (req, res) => {
  if (!req.query.completed) {
    return res.json(todos);
  }
  const completed = req.query.completed === 'true';
  //クエリパラメーターを指定したときTODOをフィルタリング
  res.json(todos.filter((todo) => todo.completed === completed));
});
app.listen(3000);
