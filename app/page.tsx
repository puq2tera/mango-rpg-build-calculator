"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";

interface CheckedItems {
  [key: number]: number;
}

export default function Home() {
  // Sample data for the tables
  const tableData1 = [
    { id: 1, name: "Item 1", value: 10 },
    { id: 2, name: "Item 2", value: 20 },
    { id: 3, name: "Item 3", value: 30 },
    { id: 4, name: "Item 4", value: 40 },
  ];

  const tableData2 = [
    { id: 1, name: "Product A", value: 100 },
    { id: 2, name: "Product B", value: 200 },
    { id: 3, name: "Product C", value: 300 },
    { id: 4, name: "Product D", value: 400 },
  ];

  // State to track the active tab
  const [activeTab, setActiveTab] = useState(1);

  // State to track which rows are checked, using the CheckedItems type
  const [checkedItems, setCheckedItems] = useState<CheckedItems>({});

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

  // Determine which table data to display
  const tableData = activeTab === 1 ? tableData1 : tableData2;

  return (
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
          <h1 className="text-xl mb-4">Checkbox Table with Sum</h1>

          {/* Tab Buttons */}
          <div className="mb-4">
            <button
                className={`px-4 py-2 ${activeTab === 1 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                onClick={() => setActiveTab(1)}
            >
              Table 1
            </button>
            <button
                className={`px-4 py-2 ml-2 ${activeTab === 2 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                onClick={() => setActiveTab(2)}
            >
              Table 2
            </button>
          </div>

          {/* Table */}
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
