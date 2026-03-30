import { useState } from "react";

type Operator = "+" | "-" | "×" | "÷";

const operatorToEndpoint: Record<Operator, string> = {
	"+": "add",
	"-": "subtract",
	"×": "multiply",
	"÷": "divide",
};

const API_URL = "http://localhost:3001";

async function callBackend(
	op: Operator,
	a: number,
	b: number,
): Promise<number> {
	const res = await fetch(`${API_URL}/${operatorToEndpoint[op]}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ a, b }),
	});
	const data = (await res.json()) as { result?: number; error?: string };
	if (!res.ok || data.error) {
		throw new Error(data.error ?? "Unknown error");
	}
	return data.result as number;
}

export function App() {
	const [display, setDisplay] = useState("0");
	const [firstOperand, setFirstOperand] = useState<number | null>(null);
	const [operator, setOperator] = useState<Operator | null>(null);
	const [waitingForSecond, setWaitingForSecond] = useState(false);

	function inputDigit(digit: string) {
		if (waitingForSecond) {
			setDisplay(digit);
			setWaitingForSecond(false);
		} else {
			setDisplay(display === "0" ? digit : display + digit);
		}
	}

	function inputDecimal() {
		if (waitingForSecond) {
			setDisplay("0.");
			setWaitingForSecond(false);
			return;
		}
		if (!display.includes(".")) {
			setDisplay(display + ".");
		}
	}

	async function handleOperator(nextOp: Operator) {
		const current = Number.parseFloat(display);

		if (firstOperand !== null && operator && !waitingForSecond) {
			try {
				const result = await callBackend(operator, firstOperand, current);
				const resultStr = String(result);
				setDisplay(resultStr);
				setFirstOperand(result);
			} catch {
				setDisplay("Error");
				setFirstOperand(null);
				setOperator(null);
				setWaitingForSecond(false);
				return;
			}
		} else {
			setFirstOperand(current);
		}

		setOperator(nextOp);
		setWaitingForSecond(true);
	}

	async function handleEquals() {
		if (firstOperand === null || operator === null) return;

		const current = Number.parseFloat(display);
		try {
			const result = await callBackend(operator, firstOperand, current);
			setDisplay(String(result));
			setFirstOperand(null);
			setOperator(null);
			setWaitingForSecond(true);
		} catch {
			setDisplay("Error");
			setFirstOperand(null);
			setOperator(null);
			setWaitingForSecond(false);
		}
	}

	function clear() {
		setDisplay("0");
		setFirstOperand(null);
		setOperator(null);
		setWaitingForSecond(false);
	}

	function toggleSign() {
		setDisplay(String(-Number.parseFloat(display)));
	}

	function percent() {
		setDisplay(String(Number.parseFloat(display) / 100));
	}

	const btn =
		"flex items-center justify-center rounded-full text-2xl font-light h-16 transition-colors active:brightness-75 cursor-pointer select-none";

	return (
		<div className="flex min-h-screen items-center justify-center bg-black">
			<div className="w-80">
				<div className="mb-2 truncate px-4 text-right font-light text-5xl text-white">
					{display}
				</div>

				<div className="grid grid-cols-4 gap-3">
					<button
						className={`${btn} bg-neutral-400 text-black`}
						onClick={clear}
						type="button"
					>
						{firstOperand !== null || operator !== null ? "C" : "AC"}
					</button>
					<button
						className={`${btn} bg-neutral-400 text-black`}
						onClick={toggleSign}
						type="button"
					>
						±
					</button>
					<button
						className={`${btn} bg-neutral-400 text-black`}
						onClick={percent}
						type="button"
					>
						%
					</button>
					<button
						className={`${btn} ${operator === "÷" && waitingForSecond ? "bg-white text-orange-500" : "bg-orange-500 text-white"}`}
						onClick={() => handleOperator("÷")}
						type="button"
					>
						÷
					</button>

					{["7", "8", "9"].map((d) => (
						<button
							className={`${btn} bg-neutral-700 text-white`}
							key={d}
							onClick={() => inputDigit(d)}
							type="button"
						>
							{d}
						</button>
					))}
					<button
						className={`${btn} ${operator === "×" && waitingForSecond ? "bg-white text-orange-500" : "bg-orange-500 text-white"}`}
						onClick={() => handleOperator("×")}
						type="button"
					>
						×
					</button>

					{["4", "5", "6"].map((d) => (
						<button
							className={`${btn} bg-neutral-700 text-white`}
							key={d}
							onClick={() => inputDigit(d)}
							type="button"
						>
							{d}
						</button>
					))}
					<button
						className={`${btn} ${operator === "-" && waitingForSecond ? "bg-white text-orange-500" : "bg-orange-500 text-white"}`}
						onClick={() => handleOperator("-")}
						type="button"
					>
						−
					</button>

					{["1", "2", "3"].map((d) => (
						<button
							className={`${btn} bg-neutral-700 text-white`}
							key={d}
							onClick={() => inputDigit(d)}
							type="button"
						>
							{d}
						</button>
					))}
					<button
						className={`${btn} ${operator === "+" && waitingForSecond ? "bg-white text-orange-500" : "bg-orange-500 text-white"}`}
						onClick={() => handleOperator("+")}
						type="button"
					>
						+
					</button>

					<button
						className={`${btn} col-span-2 justify-start bg-neutral-700 pl-7 text-white`}
						onClick={() => inputDigit("0")}
						type="button"
					>
						0
					</button>
					<button
						className={`${btn} bg-neutral-700 text-white`}
						onClick={inputDecimal}
						type="button"
					>
						.
					</button>
					<button
						className={`${btn} bg-orange-500 text-white`}
						onClick={handleEquals}
						type="button"
					>
						=
					</button>
				</div>
			</div>
		</div>
	);
}
