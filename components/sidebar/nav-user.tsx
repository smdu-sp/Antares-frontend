/** @format */

import { ChevronsUpDown } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { auth } from '@/lib/auth/auth';
import Link from 'next/link';
import BtnSignOut from '../btn-signout';
// import { useRouter } from "next/navigation";

export async function NavUser() {
	// const { isMobile } = useSidebar();
	// const router = useRouter();
	const session = await auth();

	function abreviaNome(nome: string): string {
		const nomes = nome.split(' ');
		return `${nomes[0].substring(0, 1)}${nomes[nomes.length - 1].substring(
			0,
			1,
		)}`;
	}

	function reduzNome(nome: string): string {
		if (nome.length <= 20) {
			return nome;
		}
		const nomes = nome.split(' ');
		return `${nomes[0]} ${nomes[nomes.length - 1]}`;
	}

	return (
		session &&
		session.usuario && (
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size='lg'
								className='data-[state=open]:bg-sidebar-accent cursor-pointer data-[state=open]:text-sidebar-accent-foreground'>
								<Avatar className='h-8 w-8 rounded-full aspect-square'>
									<AvatarImage src={session.usuario.avatar} />
									<AvatarFallback className='rounded-full'>
										{abreviaNome(
											session.usuario.nomeSocial || session.usuario.nome,
										)}
									</AvatarFallback>
								</Avatar>
								<div className='grid flex-1 text-left text-sm leading-tight'>
									<span className='truncate font-semibold'>
										{reduzNome(
											session.usuario.nomeSocial || session.usuario.nome,
										)}
									</span>
								</div>
								<ChevronsUpDown className='ml-auto size-4' />
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
							align='start'
							sideOffset={4}>
							<DropdownMenuItem
								asChild
								className='p-1 font-normal'>
								<Link href='perfil'>
									<div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
										<Avatar className='h-8 w-8 rounded-full'>
											<AvatarImage src={session.usuario.avatar} />
											<AvatarFallback className='rounded-full'>
												{abreviaNome(
													session.usuario.nomeSocial || session.usuario.nome,
												)}
											</AvatarFallback>
										</Avatar>
										<div className='grid flex-1 text-left text-sm leading-tight'>
											<span className='truncate font-semibold'>
												{reduzNome(
													session.usuario.nomeSocial || session.usuario.nome,
												)}
											</span>
											<span className='truncate text-xs'>
												{session.usuario.email}
											</span>
										</div>
									</div>
								</Link>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<BtnSignOut />
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		)
	);
}
