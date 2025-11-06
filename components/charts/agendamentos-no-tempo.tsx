/** @format */

'use client';

import { Area, AreaChart, CartesianGrid, LabelList, XAxis } from 'recharts';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';
import { IChart } from '@/types/agendamentos';
interface AgendamentosNoTempoProps {
	agendamentosMes: IChart[];
}

export function AgendamentoNoTempo({
	agendamentosMes,
}: AgendamentosNoTempoProps) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const chartConfig: any = {
		Agendamentos: {
			label: 'Agendamentos',
			color: 'hsl(var(--chart-1))',
		},
	} satisfies ChartConfig;

	const chartData = agendamentosMes.map((item) => {
		return {
			month: item.label,
			Agendamentos: item.value,
		};
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle className='text-xl'>Agendamentos</CardTitle>
				<CardDescription>Número de agendamentos por mês</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer
					className='w-xs h-96 md:max-h-60 md:h-full md:w-full'
					config={chartConfig}>
					<AreaChart
						accessibilityLayer
						data={chartData}
						margin={{
							left: 24,
							right: 24,
							top: 20,
						}}>
						<defs>
							<linearGradient
								id='fillDesktop'
								x1='0'
								y1='0'
								x2='0'
								y2='1'>
								<stop
									offset='5%'
									stopColor='var(--color-Agendamentos)'
									stopOpacity={0.8}
								/>
								<stop
									offset='95%'
									stopColor='var(--color-Agendamentos)'
									stopOpacity={0.1}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey='month'
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => value.slice(0, 3)}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator='line' />}
						/>
						<Area
							dataKey='Agendamentos'
							type='natural'
							fillOpacity={0.8}
							fill='url(#fillDesktop)'
							stroke='var(--color-Agendamentos)'>
							<LabelList
								position='top'
								offset={8}
								className='fill-foreground'
								fontSize={12}
							/>
						</Area>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
