import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { IndianRupee } from "lucide-react"
const FeesTable = () => {
    const [fees, setFees] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, pages: 1, total: 0 });
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchFees();
    }, [pagination.page, search, filter]);

    const fetchFees = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/fees/fetch-all-fees-for-admin`, {
                params: { page: pagination.page, limit: pagination.limit, search, filter }
            });
            setFees(response.data.data.fees);
            setTotalAmount(response.data.data.totalAmount);
            setPagination(prev => ({ ...prev, ...response.data.data.pagination }));
        } catch (error) {
            console.error('Error fetching fees:', error);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleFilterChange = (value) => {
        setFilter(value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    // Generate pagination items
    const renderPaginationItems = () => {
        const { page, pages } = pagination;
        const items = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(pages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink
                        href="#"
                        isActive={i === page}
                        onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(i);
                        }}
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        if (startPage > 1) {
            items.unshift(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>);
            items.unshift(
                <PaginationItem key={1}>
                    <PaginationLink
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(1);
                        }}
                    >
                        1
                    </PaginationLink>
                </PaginationItem>
            );
        }

        if (endPage < pages) {
            items.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>);
            items.push(
                <PaginationItem key={pages}>
                    <PaginationLink
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pages);
                        }}
                    >
                        {pages}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        return items;
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <Input
                        placeholder="Search by name or phone..."
                        value={search}
                        onChange={handleSearch}
                        className="w-64"
                    />
                    <Select value={filter} onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="yesterday">Yesterday</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-lg font-semibold">
                   <div className='flex gap-1 items-center'>
                           Total Amount: <IndianRupee className='w-4 h-4' /> <span>{totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Flagged</TableHead>
                        <TableHead>Fee Amount</TableHead>
                        <TableHead>Balance</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {fees.map(fee => (
                        <TableRow key={fee._id}>
                            <TableCell>{fee.user_id?.name || 'N/A'}</TableCell>
                            <TableCell>{fee.user_id?.role_id?.name || 'N/A'}</TableCell>
                            <TableCell>{fee.user_id?.phone_number || 'N/A'}</TableCell>
                            <TableCell>{fee.user_id?.is_flagged ? 'Yes' : 'No'}</TableCell>
                            <TableCell><div className='flex gap-1 items-center'>
                                <IndianRupee className='w-4 h-4' /><span>{parseFloat(fee.amount.$numberDecimal).toFixed(2)}</span>
                            </div></TableCell>
                            <TableCell><div className='flex gap-1 items-center'>
                                <IndianRupee className='w-4 h-4' /><span>{fee.user_balance || '0.00'}</span>
                            </div></TableCell>

                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Pagination className="mt-4">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (pagination.page > 1) handlePageChange(pagination.page - 1);
                            }}
                            className={pagination.page === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                    </PaginationItem>
                    {renderPaginationItems()}
                    <PaginationItem>
                        <PaginationNext
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (pagination.page < pagination.pages) handlePageChange(pagination.page + 1);
                            }}
                            className={pagination.page === pagination.pages ? 'pointer-events-none opacity-50' : ''}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
};

export default FeesTable;