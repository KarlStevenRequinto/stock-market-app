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

        // Fetch live stock data from Finnhub for each symbol
        const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
        if (!token) {
            console.error("FINNHUB API key not configured");
            // Return basic data without live prices
            return items.map((item) => ({
                userId: item.userId,
                symbol: item.symbol,
                company: item.company,
                addedAt: item.addedAt,
            }));
        }

        const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

        // Fetch quote and profile data for each stock in parallel
        const stocksWithData = await Promise.all(
            items.map(async (item) => {
                try {
                    // Fetch quote (price, change %)
                    const quoteUrl = `${FINNHUB_BASE_URL}/quote?symbol=${item.symbol}&token=${token}`;
                    const quoteRes = await fetch(quoteUrl, { cache: "no-store" });
                    const quoteData = (await quoteRes.json()) as QuoteData;

                    // Fetch profile (market cap)
                    const profileUrl = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${item.symbol}&token=${token}`;
                    const profileRes = await fetch(profileUrl, { cache: "no-store" });
                    const profileData = (await profileRes.json()) as ProfileData;

                    // Fetch financials (P/E ratio)
                    const financialsUrl = `${FINNHUB_BASE_URL}/stock/metric?symbol=${item.symbol}&metric=all&token=${token}`;
                    const financialsRes = await fetch(financialsUrl, { cache: "no-store" });
                    const financialsData = (await financialsRes.json()) as FinancialsData;

                    const currentPrice = quoteData?.c;
                    const changePercent = quoteData?.dp;
                    const marketCapValue = profileData?.marketCapitalization;
                    const peRatioValue = financialsData?.metric?.peExclExtraTTM || financialsData?.metric?.peNormalizedAnnual;

                    return {
                        userId: item.userId,
                        symbol: item.symbol,
                        company: item.company,
                        addedAt: item.addedAt,
                        currentPrice,
                        changePercent,
                        priceFormatted: currentPrice ? `$${currentPrice.toFixed(2)}` : undefined,
                        changeFormatted: changePercent
                            ? `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`
                            : undefined,
                        marketCap: marketCapValue
                            ? marketCapValue >= 1e3
                                ? `$${(marketCapValue / 1e3).toFixed(2)}T`
                                : marketCapValue >= 1
                                ? `$${marketCapValue.toFixed(2)}B`
                                : `$${(marketCapValue * 1e3).toFixed(2)}M`
                            : undefined,
                        peRatio: peRatioValue ? peRatioValue.toFixed(2) : undefined,
                    };
                } catch (error) {
                    console.error(`Error fetching data for ${item.symbol}:`, error);
                    // Return item with basic data if API call fails
                    return {
                        userId: item.userId,
                        symbol: item.symbol,
                        company: item.company,
                        addedAt: item.addedAt,
                    };
                }
            })
        );

        return stocksWithData;
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
