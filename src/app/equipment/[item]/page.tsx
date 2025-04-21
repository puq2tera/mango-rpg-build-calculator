import Link from 'next/link';

const Page = ({params }: { params: { item: string }}) => {
    const { item } = params;

    return (
        <div>
            <h1>ITEM DETAIL PAGE: {item}</h1>
        </div>
    )
}

export default Page