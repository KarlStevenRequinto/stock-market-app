"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WATCHLIST_TABLE_HEADER } from "@/lib/constants";
import { removeFromWatchlist } from "@/lib/actions/watchlist.actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const WatchlistTable = ({ watchlist, userId }: { watchlist: StockWithData[]; userId: string }) => {
    const [items, setItems] = useState(watchlist);
    const [removing, setRemoving] = useState<string | null>(null);

    const handleRemove = async (symbol: string) => {
        setRemoving(symbol);
        try {
            const result = await removeFromWatchlist(userId, symbol);
            if (result.success) {
                setItems((prev) => prev.filter((item) => item.symbol !== symbol));
                toast.success("Removed from watchlist");
            } else {
                toast.error(result.message || "Failed to remove");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setRemoving(null);
        }
    };

    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <p className="mb-4">Your watchlist is empty</p>
                <p className="text-sm">Add stocks to your watchlist to track them here</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {WATCHLIST_TABLE_HEADER.map((header) => (
                        <TableHead key={header} className="text-left">
                            {header}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((row) => {
                    const changeColor =
                        row.changePercent && row.changePercent > 0
                            ? "text-green-500"
                            : row.changePercent && row.changePercent < 0
                            ? "text-red-500"
                            : "text-gray-400";

                    return (
                        <TableRow key={row.symbol}>
                            <TableCell className="text-left">{row.company}</TableCell>
                            <TableCell className="text-left font-mono font-semibold">{row.symbol}</TableCell>
                            <TableCell className="text-left">{row.priceFormatted || "N/A"}</TableCell>
                            <TableCell className={`text-left ${changeColor}`}>{row.changeFormatted || "N/A"}</TableCell>
                            <TableCell className="text-left">{row.marketCap || "N/A"}</TableCell>
                            <TableCell className="text-left">{row.peRatio || "N/A"}</TableCell>
                            <TableCell className="text-left">None</TableCell>
                            <TableCell className="text-left">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemove(row.symbol)}
                                    disabled={removing === row.symbol}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                                >
                                    {removing === row.symbol ? "Removing..." : "Remove"}
                                </Button>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default WatchlistTable;
