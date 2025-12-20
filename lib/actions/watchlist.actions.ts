"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
    if (!email) return [];

    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error("MongoDB connection not found");

        // Better Auth stores users in the "user" collection
        const user = await db.collection("user").findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

        if (!user) return [];

        const userId = (user.id as string) || String(user._id || "");
        if (!userId) return [];

        const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
        return items.map((i) => String(i.symbol));
    } catch (err) {
        console.error("getWatchlistSymbolsByEmail error:", err);
        return [];
    }
}

export async function getUserWatchlist(userId: string): Promise<StockWithData[]> {
    if (!userId) return [];

    try {
        await connectToDatabase();

        const items = await Watchlist.find({ userId }).sort({ addedAt: -1 }).lean();

        return items.map((item) => ({
            userId: item.userId,
            symbol: item.symbol,
            company: item.company,
            addedAt: item.addedAt,
        }));
    } catch (err) {
        console.error("getUserWatchlist error:", err);
        return [];
    }
}

export async function addToWatchlist(userId: string, symbol: string, company: string): Promise<{ success: boolean; message: string }> {
    if (!userId || !symbol || !company) {
        return { success: false, message: "Missing required fields" };
    }

    try {
        await connectToDatabase();

        await Watchlist.create({
            userId,
            symbol: symbol.toUpperCase(),
            company,
        });

        return { success: true, message: "Added to watchlist" };
    } catch (err: any) {
        console.error("addToWatchlist error:", err);
        if (err.code === 11000) {
            return { success: false, message: "Stock already in watchlist" };
        }
        return { success: false, message: "Failed to add to watchlist" };
    }
}

export async function removeFromWatchlist(userId: string, symbol: string): Promise<{ success: boolean; message: string }> {
    if (!userId || !symbol) {
        return { success: false, message: "Missing required fields" };
    }

    try {
        await connectToDatabase();

        const result = await Watchlist.deleteOne({
            userId,
            symbol: symbol.toUpperCase(),
        });

        if (result.deletedCount === 0) {
            return { success: false, message: "Stock not found in watchlist" };
        }

        return { success: true, message: "Removed from watchlist" };
    } catch (err) {
        console.error("removeFromWatchlist error:", err);
        return { success: false, message: "Failed to remove from watchlist" };
    }
}
