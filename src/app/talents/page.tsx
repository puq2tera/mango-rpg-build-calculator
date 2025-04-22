import ToggleButton from "../components/ToggleButton"
import talent_data from "@/app/data/talent_data"

export default function talents() {
    return (
        <main>
            <h2>
                Talents Page
            </h2>
            <div>
            {Object.entries(talent_data).map(([name]) => (
                <ToggleButton
                key={name}
                id={name}
                label={name}
                />
            ))}
            </div>
            

        </main>
    )
}