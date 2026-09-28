import { useEffect, useState } from "react";
import api from "../api";

export default function BookList() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    api.get("/books").then((res) => setBooks(res.data));
  }, []);

  return books.map((b) => <p key={b._id}>{b.title}</p>);
}