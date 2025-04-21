import React from 'react'

const layout = ({children}: { children: React.ReactNode}) => {
  return (
    <div>
        <h4>Equip Dashboard</h4>
        {children}
    </div>
  )
}

export default layout