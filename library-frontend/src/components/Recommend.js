import { useQuery } from "@apollo/client";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { BOOKS_BY_GENRE, FAVORITEGENRE_BY_USER_LOGIN } from "../queries";

const Recommend = (props) => {
  const [genre, setGenre] = useState(null);
  const result = useQuery(FAVORITEGENRE_BY_USER_LOGIN);

  const resultGenre = useQuery(BOOKS_BY_GENRE, {
    variables: { genre },
    skip: !genre,
  });

  useEffect(() => {
    setGenre(result.data?.me.favoriteGenre);
  }, [result.data]);

  if (resultGenre.loading || result.loading) {
    return <div>Loading...</div>;
  }

  if (!props.show) {
    return null;
  }
  return (
    <div>
      <h2>Reccomendations</h2>
      <p>
        Books in your favorite genre patterns{" "}
        <span style={{ fontWeight: "bold" }}>{genre}</span>{" "}
      </p>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {resultGenre.data.allBooks.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Recommend;
