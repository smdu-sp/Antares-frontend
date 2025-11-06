/** @format */

'use client';

import {
	Bar,
	BarChart,
	CartesianGrid,
	LabelList,
	XAxis,
	YAxis,
} from 'recharts';

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
import { useIsMobile } from '@/hooks/use-mobile';

interface AgendamentosPorCategoriaProps {
	coordenadorias: IChart[];
}

export function AgendamentosPorCoordenadoria({
	coordenadorias,
}: AgendamentosPorCategoriaProps) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const chartConfig: any = {
		Agendamentos: {
			label: 'Agendamentos',
		},
	} satisfies ChartConfig;

	coordenadorias.sort((a, b) => b.value - a.value);
	coordenadorias.forEach((item, index) => {
		chartConfig[item.label] = {
			label: item.label,
			color: `hsl(var(--chart-${index + 1}))`,
		};
	});

	const chartData = coordenadorias.map((item) => {
		return {
			coordenadoria: item.label,
			Agendamentos: item.value,
			fill: `hsl(var(--chart-1))`,
		};
	});

	const isMobile = useIsMobile();

	return (
		<Card className='flex flex-col h-[800px] md:h-full'>
			<CardHeader className='items-start pb-0'>
				<CardTitle className='text-xl'>
					Agendamentos Por Coordenadoria
				</CardTitle>
				<CardDescription>
					Número de agendamentos por coordenadoria
				</CardDescription>
			</CardHeader>
			<CardContent className='flex-1 pb-0'>
				{isMobile ? (
					<ChartContainer
						config={chartConfig}
						className='mx-auto w-full max-h-full h-full'>
						<BarChart
							accessibilityLayer
							data={chartData}
							layout='vertical'
							margin={{
								left: 20,
								right: 40,
							}}>
							<ChartTooltip
								cursor={false}
								content={<ChartTooltipContent indicator='line' />}
							/>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey='Agendamentos'
								type='number'
								hide
							/>
							<YAxis
								dataKey='coordenadoria'
								type='category'
								tickLine={false}
								tickMargin={10}
								height={400}
								axisLine={false}
							/>

							<Bar
								data={chartData}
								fill='var(--color-coordenadoria)'
								radius={8}
								strokeWidth={2}
								dataKey='Agendamentos'>
								<LabelList
									position='right'
									offset={8}
									className='fill-foreground'
									fontSize={12}
								/>
							</Bar>
						</BarChart>
					</ChartContainer>
				) : (
					<ChartContainer
						config={chartConfig}
						className='mx-auto w-full max-h-[300px] flex items-center justify-center'>
						<BarChart
							accessibilityLayer
							data={chartData}
							margin={{
								top: 20,
							}}>
							<ChartTooltip
								cursor={false}
								content={<ChartTooltipContent indicator='line' />}
							/>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey='coordenadoria'
								tickLine={false}
								tickMargin={12}
								axisLine={false}
							/>

							<Bar
								data={chartData}
								fill='var(--color-agendamentos)'
								radius={8}
								strokeWidth={2}
								dataKey='Agendamentos'>
								<LabelList
									position='top'
									offset={8}
									className='fill-foreground'
									fontSize={12}
								/>
							</Bar>
						</BarChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}
