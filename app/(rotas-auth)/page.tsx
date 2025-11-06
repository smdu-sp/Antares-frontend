/** @format */

import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
	const session = await auth();
	if (!session) {
		redirect('/login');
	}

	return (
		<div className=' w-full relative px-0 md:px-8 pb-10 md:pb-0'>
			<h1 className='text-xl md:text-4xl font-bold'>Home</h1>
			<div className='flex flex-col gap-5 my-5 w-full'></div>
		</div>
	);
}
