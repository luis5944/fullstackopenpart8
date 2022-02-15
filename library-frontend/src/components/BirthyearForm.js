import { useMutation } from "@apollo/client";
import React from "react";
import { useState } from "react";
import Select from "react-select";
import { ALL_AUTHORS, ALL_BOOKS, UPDATE_BIRTHYEAR } from "../queries";

const BirthyearForm = ({ authors }) => {
  authors = authors.map((a) => {
    return { value: a.name, label: a.name };
  });
  const [name, setName] = useState(null);
  const [born, setBorn] = useState("");
  const [updateBirthyear] = useMutation(UPDATE_BIRTHYEAR, {
    refetchQueries: [ALL_AUTHORS, ALL_BOOKS],
  });

  const submit = (e) => {
    e.preventDefault();
    updateBirthyear({
      variables: { name: name.value, setBornTo: Number(born) },
    });
  };

  return (
    <div>
      <h2>Set birthyear</h2>
      <form onSubmit={submit}>
        <div>
          <Select defaultValue={name} onChange={setName} options={authors} />
        </div>
        <div>
          <label htmlFor="born">born</label>
          <input
            type="number"
            name="born"
            id="born"
            value={born}
            onChange={(e) => {
              setBorn(e.target.value);
            }}
          />
        </div>
        <button>Update author</button>
      </form>
    </div>
  );
};

export default BirthyearForm;
