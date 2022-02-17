import { useQuery } from "@apollo/client";
import React from "react";
import { useState } from "react";
import { ALL_BOOKS, BOOKS_BY_GENRE } from "../queries";
import Genres from "./Genres";

const Books = (props) => {
  const result = useQuery(ALL_BOOKS);
  const [genrePick, setGenrePick] = useState("");

  const resultGenre = useQuery(BOOKS_BY_GENRE, {
    variables: { genre: genrePick },
    skip: !genrePick,
  });

  if (!props.show) {
    return null;
  }

  if (result.loading || resultGenre.loading) {
    return <div>Loading</div>;
  }
  const set = new Set();

  result.data.allBooks
    .map((book) => book.genres)
    .flat()
    .forEach((e) => set.add(e));

  return (
    <div>
      <h2>books</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {genrePick
            ? resultGenre.data.allBooks.map((a) => (
                <tr key={a.title}>
                  <td>{a.title}</td>
                  <td>{a.author.name}</td>
                  <td>{a.published}</td>
                </tr>
              ))
            : result.data.allBooks.map((a) => (
                <tr key={a.title}>
                  <td>{a.title}</td>
                  <td>{a.author.name}</td>
                  <td>{a.published}</td>
                </tr>
              ))}
        </tbody>
      </table>
      <Genres genres={Array.from(set)} setGenrePick={setGenrePick} />
    </div>
  );
};

export default Books;
