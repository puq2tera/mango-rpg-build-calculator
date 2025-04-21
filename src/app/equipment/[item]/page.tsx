import { FC } from 'react'

interface PageProps {
  params: {
    item: string
  }
}

const Page: FC<PageProps> = ({ params }) => {
  return <div>Item: {params.item}</div>
}

export default Page
