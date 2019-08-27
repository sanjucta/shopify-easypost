

--
-- Database: `easypost_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `order_fulfillment`
--

CREATE TABLE `order_fulfillment` (
  `id` int(11) NOT NULL,
  `shopify_order_id` varchar(50) NOT NULL,
  `easypost_order_id` varchar(50) DEFAULT NULL,
  `line_items_marked_for_fulfillment` varchar(300) NOT NULL,
  `shopify_fulfillment_id` varchar(150) DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `shop_domain` varchar(50) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;


--
-- Table structure for table `order_tracking_details`
--

CREATE TABLE `order_tracking_details` (
  `id` int(20) NOT NULL,
  `easypost_order_id` varchar(50) NOT NULL,
  `easypost_tracker_id` varchar(50) NOT NULL,
  `tracking_code` varchar(50) NOT NULL,
  `tracking_url` varchar(150) NOT NULL,
  `carrier` varchar(50) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;


--
-- Table structure for table `shop_tokens`
--

CREATE TABLE `shop_tokens` (
  `id` int(10) NOT NULL,
  `shop_domain` varchar(50) NOT NULL,
  `access_token` varchar(50) NOT NULL,
  `fulfillment_service_id` varchar(100) DEFAULT NULL,
  `fulfillment_service_location_id` varchar(100) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;


--
-- Indexes for dumped tables
--

--
-- Indexes for table `order_fulfillment`
--
ALTER TABLE `order_fulfillment`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_tracking_details`
--
ALTER TABLE `order_tracking_details`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `shop_tokens`
--
ALTER TABLE `shop_tokens`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `order_fulfillment`
--
ALTER TABLE `order_fulfillment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;
--
-- AUTO_INCREMENT for table `order_tracking_details`
--
ALTER TABLE `order_tracking_details`
  MODIFY `id` int(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;
--
-- AUTO_INCREMENT for table `shop_tokens`
--
ALTER TABLE `shop_tokens`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
