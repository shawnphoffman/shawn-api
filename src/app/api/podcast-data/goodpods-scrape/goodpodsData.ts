export interface Podcast {
	itunes_id: string
	podcast_id: number
	goodpods_id: string
	goodpods_uri: string
	title: string
	artist: string
	description: string
	description_dangerous_html: string
	season_nums: number[]
	track_count: number
	is_explicit: boolean
	language: string
	is_bookmarked: boolean
	image: string
	is_subscribed: boolean
	review_average: number
	total_reviews: number
	friend_listen_data: Record<string, unknown>
	summary_listen_data: SummaryListenData
	first_episode: null
	has_tip_jar: boolean
	tip_jars: any[]
	is_owner: boolean
	owner_images: string[]
	owner_user_ids: number[]
	num_owners: number
	leaderboard: Leaderboard
	leaderboard_info_list: Leaderboard[]
	is_in_playlist: null
	num_comments: number
	num_unique_listeners: number
	curated_lists: any[]
}

export interface SummaryListenData {
	listened_user_images: string[]
	display_listen_count: number
	guest_listener_count: number
	user_listener_count: number
}

export interface Leaderboard {
	leaderboard_id: number
	category_tag: string
	period_type: string
	indie_only: boolean
	current_position: number
	last_position: number
	episode_id: null
	podcast_id: number
	user_id: null
	user_leaderboard_type: null
	url_slug: string
	keyword_slug: string
}

/**
<div style="display: flex; flex-direction: column; align-items: center;"> <a href="https://goodpods.com/leaderboard/top-100-shows-by-category/leisure/animation-and-manga?indie=true&period=month#47389848" target="_blank"> <img src="https://storage.googleapis.com/goodpods-images-bucket/leaderboard_badges/leisure_animation-and-manga_top1_month.png" alt="goodpods top 100 animation & manga indie podcasts" style="width: 250px; height: 77px;" /> </a> <a href="https://goodpods.com/leaderboard/top-100-shows-by-category/leisure/animation-and-manga" style="text-decoration: none; color: #6F6F6F; font-size: 13px; font-family: Arial, Helvetica, sans-serif; text-align: center; line-height: 16px; margin-top: 4px;" target="_blank"> Goodpods Top 100 Animation & Manga Indie Podcasts </a> <a href="https://goodpods.com/podcasts/dinner-with-the-heelers-a-bluey-podcast-277737" style="text-decoration: none; color: #6F6F6F; font-size: 13px; font-family: Arial, Helvetica, sans-serif; text-align: center; line-height: 16px; margin-top: 4px;" target="_blank"> Listen now to Dinner with the Heelers - A Bluey Podcas<br/>t </a> </div>
 */

export interface GoodpodsAward {
	/** Goodpods Top 100 Animation & Manga Indie Podcasts */
	title?: string
	frequency: 'Weekly' | 'Monthly' | 'All-Time'
	/** https://goodpods.com/leaderboard/top-100-shows-by-category/leisure/animation-and-manga?indie=true&period=month#47389848 */
	// https://goodpods.com/leaderboard/top-100-shows-by-category/leisure/animation-and-manga?indie=true&period=alltime#47389791
	linkUrl: string
	// https://storage.googleapis.com/goodpods-images-bucket/leaderboard_badges/tv-and-film_all-tv-and-film_top50_week.png
	/** https://storage.googleapis.com/goodpods-images-bucket/leaderboard_badges/leisure_animation-and-manga_top1_month.png */
	// https://storage.googleapis.com/goodpods-images-bucket/leaderboard_badges/leisure_animation-and-manga_top2_month.png
	// https://storage.googleapis.com/goodpods-images-bucket/leaderboard_badges/leisure_animation-and-manga_top3_week.png
	// https://storage.googleapis.com/goodpods-images-bucket/leaderboard_badges/leisure_animation-and-manga_top10.png
	// top 1,2,3,5,10,20,50,100
	imageUrl: string
	/** 250 */
	imageWidth: number
	/** 77 */
	imageHeight: number
	/** animation-and-manga */
	category: string
}
