import talentsData from '../public/talentdata.json'; // Adjust the path based on where the JSON file is located
import { useState } from 'react';


export default function TalentsTable() {
    // State to track checked rows

    const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});

    // Handle checkbox change
    const handleCheckboxChange = (talentName: string) => {
        setCheckedItems((prevState) => ({
            ...prevState,
            [talentName]: !prevState[talentName], // Toggle the checkbox state
        }));
    };

    return (
        <div>
            <h1>Talents Table</h1>
            <table cellPadding="5" cellSpacing="0">
                <thead>
                <tr>
                    <th></th>
                    {/* Add a column for checkboxes */}
                    <th>Talent</th>
                    <th>PreReq</th>
                    <th>Blocked if Tag</th>
                    <th>TP Spent</th>
                    <th>Lvl</th>
                    <th>T</th>
                    <th>W</th>
                    <th>C</th>
                    <th>H</th>
                    <th>Description</th>
                </tr>
                </thead>
                <tbody>
                {Object.keys(talentsData).map((talentName) => {
                    const talent = talentsData[talentName];
                    return (
                        <tr key={talentName}>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={checkedItems[talentName]}
                                    onChange={() => handleCheckboxChange(talentName)}
                                />
                            </td>
                            <td>{talentName}</td>
                            <td>{talent.PreReq}</td>
                            <td>{talent['Blocked if Tag']}</td>
                            <td>{talent['TP Spent']}</td>
                            <td>{talent.Lvl}</td>
                            <td>{talent.tankLevels}</td>
                            <td>{talent.warriorLevels}</td>
                            <td>{talent.casterLevels}</td>
                            <td>{talent.healerLevels}</td>
                            <td>{talent.Description}</td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}
