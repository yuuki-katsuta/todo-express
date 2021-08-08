import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import 'isomorphic-fetch';

// 各ページに関する情報の定義
const pages = {
  index: { title: 'すべてのToDo', fetchQuery: '' },
  active: {
    title: '未完了のToDo',
    //fetchQuery: '?completed=false',
    completed: false,
  },
  completed: {
    title: '完了したToDo',
    //fetchQuery: '?completed=true',
    completed: true,
  },
};
// CSRでページを切り替えるためのリンク
//Object.keysでオブジェクトのキーを配列として取得する
const pageLinks = Object.keys(pages).map((page, index) => (
  <Link href={`/${page === 'index' ? '' : page}`} key={index}>
    <a style={{ marginRight: 10 }}>{pages[page].title}</a>
  </Link>
));

const Todos = (props) => {
  const { title, fetchQuery, completed } = pages[props.page];
  const [todos, setTodos] = useState([]);

  // useEffect(() => {
  //   fetch(`/api/todos${fetchQuery}`).then(async (res) =>
  //     res.ok ? setTodos(await res.json()) : alert(await res.text())
  //   );
  // }, [props.page]);

  useEffect(() => {
    // EventSourceを使った実装に置き換え
    const eventSource = new EventSource('/api/todos/events'); //todo一覧を取得しに行く→SSE受信
    // SSE受信時の処理
    eventSource.addEventListener('message', (e) => {
      console.log(e); //現在のtodo一覧取得
      if (!e.data) {
        return console.log('empty event');
      }
      const todos = JSON.parse(e.data);
      setTodos(
        typeof completed === 'undefined'
          ? todos
          : todos.filter((todo) => todo.completed === completed)
      );
    });
    // エラーハンドリング
    eventSource.onerror = (e) => console.log('SSEエラー', e);
    // useEffectで関数を返すとコンポーネントのクリーンアップ時に実行される
    // ここでは、EventSourceインスタンスをクローズする
    return () => eventSource.close();
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
