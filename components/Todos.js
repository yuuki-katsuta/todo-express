import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import 'isomorphic-fetch';

// 各ページに関する情報の定義
const pages = {
  index: { title: 'すべてのToDo', fetchQuery: '' },
  active: { title: '未完了のToDo', fetchQuery: '?completed=false' },
  completed: { title: '完了したToDo', fetchQuery: '?completed=true' },
};
// CSRでページを切り替えるためのリンク
//Object.keysでオブジェクトのキーを配列として取得する
const pageLinks = Object.keys(pages).map((page, index) => (
  <Link href={`/${page === 'index' ? '' : page}`} key={index}>
    <a style={{ marginRight: 10 }}>{pages[page].title}</a>
  </Link>
));

const Todos = (props) => {
  const { title, fetchQuery } = pages[props.page];
  const [todos, setTodos] = useState([]);
  useEffect(() => {
    fetch(`/api/todos${fetchQuery}`).then(async (res) =>
      res.ok ? setTodos(await res.json()) : alert(await res.text())
    );
  }, [props.page]);

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <h1>{title}</h1>
      {/* ToDo一覧の表示 */}
      <ul>
        {todos.map(({ id, title, completed }) => (
          <li key={id}>
            <span style={completed ? { textDecoration: 'line-through' } : {}}>
              {title}
            </span>
          </li>
        ))}
      </ul>
      <div>{pageLinks}</div>
    </>
  );
};

export default Todos;
