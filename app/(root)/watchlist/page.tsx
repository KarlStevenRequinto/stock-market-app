import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserWatchlist } from "@/lib/actions/watchlist.actions";
import WatchlistTable from "@/components/WatchlistTable";

const WatchlistPage = async () => {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        redirect("/sign-in");
    }

    const userId = session.user.id;
    const watchlist = await getUserWatchlist(userId);

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-100 mb-2">My Watchlist</h1>
                <p className="text-gray-400">Track your favorite stocks in one place</p>
            </div>

            <div className="bg-gray-950 rounded-lg border border-gray-800 p-6">
                <WatchlistTable watchlist={watchlist} userId={userId} />
            </div>
        </div>
    );
};

export default WatchlistPage;
