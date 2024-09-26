"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";

export default function Home() {
  // Sample data for the table
  const tableData = [
    { id: 1, name: "Item 1", value: 10 },
    { id: 2, name: "Item 2", value: 20 },
    { id: 3, name: "Item 3", value: 30 },
    { id: 4, name: "Item 4", value: 40 },
  ];

  // State to track which rows are checked
  const [checkedItems, setCheckedItems] = useState({});

  // Load checked items from cookies on component mount
  useEffect(() => {
    const storedCheckedItems = Cookies.get("checkedItems");
    if (storedCheckedItems) {
      setCheckedItems(JSON.parse(storedCheckedItems));
    }
  }, []);

  // Handler to toggle checkbox state
  const handleCheckboxChange = (id: number, value: number) => {
    setCheckedItems((prevState) => {
      const updatedCheckedItems = {
        ...prevState,
        [id]: !prevState[id] ? value : 0,
      };
      // Save updated state to cookies
      Cookies.set("checkedItems", JSON.stringify(updatedCheckedItems), { expires: 7 });
      return updatedCheckedItems;
    });
  };

  // Calculate the total sum of checked rows
  const totalSum = Object.values(checkedItems).reduce((acc, val) => acc + val, 0);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-xl mb-4">Checkbox Table with Sum</h1>
        <table className="table-auto border-collapse">
          <thead>
            <tr>
              <th className="border px-4 py-2">Select</th>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Value</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((item) => (
              <tr key={item.id}>
                <td className="border px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={!!checkedItems[item.id]}
                    onChange={() => handleCheckboxChange(item.id, item.value)}
                  />
                </td>
                <td className="border px-4 py-2">{item.name}</td>
                <td className="border px-4 py-2">{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4">
          <strong>Total Sum:</strong> {totalSum}
        </div>
      </main>
    </div>
  );
}
