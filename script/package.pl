#!/usr/bin/perl

# Autoflush
BEGIN { $| = 1 }

use strict;
use utf8;

use Data::Dumper;
use FindBin;
use lib $FindBin::Bin.'/lib';

use Packager;

my @files = qw(Required.js Attribute.js Attribute/Lazy.js Attributes.js);

my $outfile = $FindBin::Bin.'/../../lib/MooTools/Class/Attributes.js';
my $indir = $FindBin::Bin.'/../lib/MooTools/Class/';

Packager->new_with_options(
    files   => [ map { $indir.$_ } @files ],
    outfile => $outfile
)->run;

1;