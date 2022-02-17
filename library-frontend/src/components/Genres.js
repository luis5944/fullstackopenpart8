import React from "react";

const Genres = ({ genres, setGenrePick }) => {
  if (!genres) {
    return null;
  }
  return (
    <div>
      Filter by genre:
      {genres.map((name) => (
        <button
          key={name}
          onClick={() => {
            setGenrePick(name);
          }}
        >
          {name}
        </button>
      ))}
      <button onClick={() => setGenrePick(null)}>all</button>
    </div>
  );
};

export default Genres;
